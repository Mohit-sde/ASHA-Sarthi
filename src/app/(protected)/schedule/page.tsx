"use client";

import { useState } from "react";
import { Badge, Card, EmptyState, PageHeader, PageShell, StatTile, type Tone } from "../../../../components/ui/Kit";
import NewVisitModal from "../../../../components/forms/NewVisitModal";
import { useVisitsForDay } from "../../../../hooks/useVisits";
import { setVisitStatus } from "../../../../lib/firebase/db/visitService";
import { displayStatus, formatTime, startOfDay, type DisplayStatus } from "../../../../lib/firebase/db/types";

const DAYS = Array.from({ length: 7 }, (_, i) => startOfDay(i));

const STATUS_META: Record<DisplayStatus, { label: string; tone: Tone; dot: string }> = {
  scheduled: { label: "Scheduled", tone: "indigo", dot: "bg-indigo-500" },
  overdue: { label: "Overdue", tone: "amber", dot: "bg-amber-500" },
  completed: { label: "Completed", tone: "emerald", dot: "bg-emerald-500" },
  missed: { label: "Missed", tone: "rose", dot: "bg-rose-500" },
};

export default function SchedulePage() {
  const [index, setIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const day = DAYS[index];
  const { visits, loading, error } = useVisitsForDay(day);
  const now = new Date();
  const statuses = visits.map((v) => displayStatus(v, now));
  const count = (s: DisplayStatus) => statuses.filter((x) => x === s).length;
  const open = count("scheduled") + count("overdue");

  async function mark(id: string, status: "completed" | "missed") {
    setActionError(null);
    try {
      await setVisitStatus(id, status);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not update visit.");
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Schedule"
        subtitle={day.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        actions={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
          >
            + Add visit
          </button>
        }
      />

      <div role="tablist" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {DAYS.map((d, i) => {
          const active = i === index;
          return (
            <button
              key={d.getTime()}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setIndex(i)}
              className={`flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-3 text-sm transition ${
                active ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-indigo-300"
              }`}
            >
              <span className="text-xs font-medium opacity-80">{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
              <span className="text-lg font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <section className="grid grid-cols-3 gap-4">
        <StatTile label="Planned" value={visits.length} tone="indigo" />
        <StatTile label="Completed" value={count("completed")} tone="emerald" />
        <StatTile label="Open" value={open} tone="amber" />
      </section>

      {actionError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p>}

      <Card>
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">Visit timeline</h2>
          <p className="text-sm text-gray-500">Times are local</p>
        </div>

        {error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : loading ? (
          <p className="text-sm text-gray-500">Loading visits…</p>
        ) : visits.length === 0 ? (
          <EmptyState title="No visits planned" description="Pick another day or add a visit for this date." />
        ) : (
          <ol className="relative space-y-6 border-l-2 border-gray-100 pl-6">
            {visits.map((v) => {
              const status = displayStatus(v, now);
              const meta = STATUS_META[status];
              const isOpen = status === "scheduled" || status === "overdue";
              return (
                <li key={v.id} className="relative">
                  <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${meta.dot}`} />
                  <div className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-medium text-gray-500">
                        {formatTime(v.scheduledAt.toDate())} · {v.durationMin} min
                      </p>
                      <p className="font-semibold text-gray-900">
                        {v.patientName} · {v.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {v.ward}
                        {v.patientCode && ` · ${v.patientCode}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {isOpen && (
                        <>
                          <button
                            type="button"
                            onClick={() => mark(v.id, "completed")}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95"
                          >
                            Mark done
                          </button>
                          <button
                            type="button"
                            onClick={() => mark(v.id, "missed")}
                            className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 active:scale-95"
                          >
                            Missed
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <NewVisitModal open={adding} onClose={() => setAdding(false)} defaultDate={day} />
    </PageShell>
  );
}