"use client";

import { useState } from "react";
import { Badge, Card, EmptyState, PageHeader, PageShell, StatTile, type Tone } from "../../../../components/ui/Kit";

type Status = "done" | "next" | "upcoming" | "overdue";

interface Visit {
  time: string;
  patient: string;
  type: string;
  ward: string;
  duration: string;
  status: Status;
}

// Fixed base date keeps server and client renders identical.
const BASE = new Date(2026, 9, 31);

const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(BASE);
  d.setDate(d.getDate() + i);
  return {
    key: i,
    weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
    date: d.getDate(),
    full: d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
  };
});

const VISITS: Record<number, Visit[]> = {
  0: [
    { time: "9:30 AM", patient: "Demo Patient A", type: "Home visit", ward: "Ward 4", duration: "30 min", status: "done" },
    { time: "11:00 AM", patient: "Demo Patient B", type: "ANC check-up", ward: "Ward 4", duration: "45 min", status: "done" },
    { time: "2:15 PM", patient: "Demo Patient C", type: "Immunisation", ward: "Ward 7", duration: "20 min", status: "next" },
    { time: "3:30 PM", patient: "Demo Patient D", type: "Growth monitoring", ward: "Ward 7", duration: "25 min", status: "upcoming" },
    { time: "4:45 PM", patient: "Demo Patient E", type: "Follow-up visit", ward: "Ward 9", duration: "30 min", status: "overdue" },
  ],
  1: [
    { time: "10:00 AM", patient: "Demo Patient F", type: "ANC check-up", ward: "Ward 2", duration: "40 min", status: "upcoming" },
    { time: "12:30 PM", patient: "Demo Patient G", type: "Home visit", ward: "Ward 2", duration: "30 min", status: "upcoming" },
    { time: "3:00 PM", patient: "Demo Patient H", type: "Immunisation", ward: "Ward 5", duration: "20 min", status: "upcoming" },
  ],
  2: [
    { time: "9:00 AM", patient: "Demo Patient I", type: "Growth monitoring", ward: "Ward 5", duration: "25 min", status: "upcoming" },
    { time: "1:00 PM", patient: "Demo Patient J", type: "Home visit", ward: "Ward 5", duration: "30 min", status: "upcoming" },
  ],
  3: [],
  4: [
    { time: "8:30 AM", patient: "Demo Patient K", type: "Immunisation", ward: "Ward 1", duration: "20 min", status: "upcoming" },
    { time: "9:15 AM", patient: "Demo Patient L", type: "ANC check-up", ward: "Ward 1", duration: "40 min", status: "upcoming" },
    { time: "11:00 AM", patient: "Demo Patient M", type: "Home visit", ward: "Ward 3", duration: "30 min", status: "upcoming" },
    { time: "1:30 PM", patient: "Demo Patient N", type: "Follow-up visit", ward: "Ward 3", duration: "30 min", status: "upcoming" },
    { time: "3:00 PM", patient: "Demo Patient O", type: "Growth monitoring", ward: "Ward 6", duration: "25 min", status: "upcoming" },
  ],
  5: [{ time: "10:00 AM", patient: "Demo Patient P", type: "Home visit", ward: "Ward 6", duration: "30 min", status: "upcoming" }],
  6: [],
};

const STATUS_META: Record<Status, { label: string; tone: Tone; dot: string }> = {
  done: { label: "Done", tone: "emerald", dot: "bg-emerald-500" },
  next: { label: "Next", tone: "indigo", dot: "bg-indigo-500" },
  upcoming: { label: "Upcoming", tone: "gray", dot: "bg-gray-400" },
  overdue: { label: "Overdue", tone: "rose", dot: "bg-rose-500" },
};

export default function SchedulePage() {
  const [selected, setSelected] = useState(0);
  const visits = VISITS[selected] ?? [];
  const done = visits.filter((v) => v.status === "done").length;
  const pending = visits.length - done;
  const day = DAYS[selected];

  return (
    <PageShell>
      <PageHeader
        title="Schedule"
        subtitle={day.full}
        actions={
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
          >
            + Add visit
          </button>
        }
      />

      {/* Day strip */}
      <div role="tablist" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {DAYS.map((d) => {
          const active = d.key === selected;
          const count = VISITS[d.key]?.length ?? 0;
          return (
            <button
              key={d.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(d.key)}
              className={`flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-3 text-sm transition ${
                active
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-indigo-300"
              }`}
            >
              <span className="text-xs font-medium opacity-80">{d.weekday}</span>
              <span className="text-lg font-bold">{d.date}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : count ? "bg-indigo-400" : "bg-gray-300"}`} />
            </button>
          );
        })}
      </div>

      <section className="grid grid-cols-3 gap-4">
        <StatTile label="Planned" value={visits.length} tone="indigo" />
        <StatTile label="Completed" value={done} tone="emerald" />
        <StatTile label="Remaining" value={pending} tone="amber" />
      </section>

      <Card>
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">Visit timeline</h2>
          <p className="text-sm text-gray-500">Times are local (dummy)</p>
        </div>

        {visits.length === 0 ? (
          <EmptyState title="No visits planned" description="Pick another day or add a visit for this date." />
        ) : (
          <ol className="relative space-y-6 border-l-2 border-gray-100 pl-6">
            {visits.map((v) => {
              const meta = STATUS_META[v.status];
              return (
                <li key={v.time + v.patient} className="relative">
                  <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${meta.dot}`} />
                  <div className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-medium text-gray-500">
                        {v.time} · {v.duration}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {v.patient} · {v.type}
                      </p>
                      <p className="text-xs text-gray-500">{v.ward}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {v.status === "next" && (
                        <button
                          type="button"
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
                        >
                          Start
                        </button>
                      )}
                      {v.status === "overdue" && (
                        <button
                          type="button"
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 active:scale-95"
                        >
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </PageShell>
  );
}