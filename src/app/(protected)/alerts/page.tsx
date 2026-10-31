"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PageShell,
  SearchInput,
  Tabs,
  type Tone,
} from "../../../../components/ui/Kit";
import NewVisitModal, { type VisitPrefill } from "../../../../components/forms/NewVisitModal";
import { useAllVisits, usePatients } from "../../../../hooks/useWorkerData";
import { setVisitStatus } from "../../../../lib/firebase/db/visitService";
import { buildAlerts, type AlertSeverity, type AppAlert } from "../../../../lib/alerts/buildAlerts";

const SEVERITY_META: Record<AlertSeverity, { label: string; tone: Tone; border: string }> = {
  critical: { label: "Critical", tone: "rose", border: "border-l-rose-500" },
  warning: { label: "Warning", tone: "amber", border: "border-l-amber-500" },
  info: { label: "Info", tone: "indigo", border: "border-l-indigo-500" },
};

export default function AlertsPage() {
  const { visits, loading: vLoading, error: vError } = useAllVisits();
  const { patients, loading: pLoading } = usePatients();

  const [filter, setFilter] = useState<"all" | AlertSeverity>("all");
  const [query, setQuery] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<VisitPrefill | null>(null);

  const alerts = useMemo(
    () => buildAlerts(visits, patients).filter((a) => !dismissed.includes(a.id)),
    [visits, patients, dismissed],
  );

  const countOf = (s: AlertSeverity) => alerts.filter((a) => a.severity === s).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter(
      (a) =>
        (filter === "all" || a.severity === filter) &&
        `${a.title} ${a.detail} ${a.category}`.toLowerCase().includes(q),
    );
  }, [alerts, filter, query]);

  async function complete(a: AppAlert) {
    if (!a.visitId) return;
    setBusyId(a.id);
    setActionError(null);
    try {
      await setVisitStatus(a.visitId, "completed");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not update visit.");
    } finally {
      setBusyId(null);
    }
  }

  function schedule(a: AppAlert) {
    if (!a.patient) return;
    setScheduleTarget({
      patientName: a.patient.name,
      patientCode: a.patient.patientCode,
      criticalLevel: a.patient.criticalLevel,
      ward: a.patient.ward || undefined,
    });
  }

  const loading = vLoading || pLoading;

  return (
    <PageShell>
      <PageHeader
        title="Alerts"
        subtitle={loading ? "Loading…" : `${alerts.length} open · ${countOf("critical")} critical`}
      />

      {(vError || actionError) && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{vError ?? actionError}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          options={[
            { value: "all", label: "All", count: alerts.length },
            { value: "critical", label: "Critical", count: countOf("critical") },
            { value: "warning", label: "Warning", count: countOf("warning") },
            { value: "info", label: "Info", count: countOf("info") },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search alerts…" />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Loading alerts…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          title={alerts.length === 0 ? "You're all caught up" : "No alerts match"}
          description={
            alerts.length === 0
              ? "Overdue visits and critical patients without follow-ups appear here."
              : "Try a different filter or search term."
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((a) => {
            const meta = SEVERITY_META[a.severity];
            const busy = busyId === a.id;
            return (
              <li key={a.id}>
                <Card className={`border-l-4 ${meta.border} p-4 sm:p-5`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <Badge>{a.category}</Badge>
                      </div>
                      <p className="font-semibold text-gray-900">{a.title}</p>
                      <p className="text-sm text-gray-500">{a.detail}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {a.action === "complete" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => complete(a)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                        >
                          {busy ? "Saving…" : "Mark done"}
                        </button>
                      )}
                      {a.action === "schedule" && (
                        <button
                          type="button"
                          onClick={() => schedule(a)}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
                        >
                          Schedule visit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDismissed((d) => [...d, a.id])}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <NewVisitModal
        open={scheduleTarget !== null}
        onClose={() => setScheduleTarget(null)}
        prefill={scheduleTarget ?? undefined}
      />
    </PageShell>
  );
}