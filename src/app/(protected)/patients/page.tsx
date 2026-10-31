"use client";

import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PageShell,
  SearchInput,
  StatTile,
  Tabs,
} from "../../../../components/ui/Kit";
import AddPatientModal from "../../../../components/forms/AddPatientModal";
import NewVisitModal, { type VisitPrefill } from "../../../../components/forms/NewVisitModal";
import AddRecordModal, { type RecordPatient } from "../../../../components/forms/AddRecordModal";
import { useAllVisits, usePatients, useRecords } from "../../../../hooks/useWorkerData";
import {
  CRITICAL_LEVELS,
  CRITICAL_META,
  displayStatus,
  formatDate,
  formatTime,
  type CriticalLevel,
  type PatientDoc,
  type RecordDoc,
  type VisitDoc,
} from "../../../../lib/firebase/db/types";

type Filter = "all" | CriticalLevel;
interface Summary {
  next: VisitDoc | null;
  last: VisitDoc | null;
  total: number;
}

export default function PatientsPage() {
  const { patients, loading: pLoading, error: pError } = usePatients();
  const { visits, loading: vLoading } = useAllVisits();
  const { records, loading: rLoading, error: rError } = useRecords();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<VisitPrefill | null>(null);
  const [recordTarget, setRecordTarget] = useState<RecordPatient | null>(null);

  // Visit summary per patient.
  const summaries = useMemo(() => {
    const now = new Date();
    const map = new Map<string, Summary>();
    for (const v of visits) {
      if (!v.patientId) continue;
      const s = map.get(v.patientId) ?? { next: null, last: null, total: 0 };
      s.total++;
      const status = displayStatus(v, now);
      const when = v.scheduledAt.toMillis();
      if ((status === "scheduled" || status === "overdue") && (!s.next || when < s.next.scheduledAt.toMillis())) {
        s.next = v;
      }
      if (status === "completed" && (!s.last || when > s.last.scheduledAt.toMillis())) {
        s.last = v;
      }
      map.set(v.patientId, s);
    }
    return map;
  }, [visits]);

  // Records grouped by patient ID. Older records without a patientId are matched by patient code.
  const recordsByKey = useMemo(() => {
    const m = new Map<string, RecordDoc[]>();
    for (const r of records) {
      const key = r.patientId ?? `code:${r.patientCode}`;
      m.set(key, [...(m.get(key) ?? []), r]);
    }
    return m;
  }, [records]);

  const recordsFor = (p: PatientDoc): RecordDoc[] =>
    recordsByKey.get(p.id) ?? (p.patientCode ? recordsByKey.get(`code:${p.patientCode}`) : undefined) ?? [];

  const counts = useMemo(() => {
    const c = Object.fromEntries(CRITICAL_LEVELS.map((l) => [l, 0])) as Record<CriticalLevel, number>;
    patients.forEach((p) => c[p.criticalLevel]++);
    return c;
  }, [patients]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients
      .filter(
        (p) =>
          (filter === "all" || p.criticalLevel === filter) &&
          `${p.name} ${p.patientCode} ${p.ward} ${p.condition}`.toLowerCase().includes(q),
      )
      .sort((a, b) => CRITICAL_META[b.criticalLevel].rank - CRITICAL_META[a.criticalLevel].rank);
  }, [patients, filter, query]);

  const selected = patients.find((p) => p.id === selectedId) ?? null;
  const selectedSummary = selected ? summaries.get(selected.id) : undefined;
  const selectedRecords = selected ? recordsFor(selected) : [];
  const withUpcoming = patients.filter((p) => summaries.get(p.id)?.next).length;
  const highRisk = counts.high + counts.critical;
  const needsFollowUp = patients.filter(
    (p) => CRITICAL_META[p.criticalLevel].rank >= 3 && !summaries.get(p.id)?.next,
  ).length;

  const loading = pLoading || vLoading || rLoading;

  return (
    <PageShell>
      <PageHeader
        title="Patients"
        subtitle={loading ? "Loading…" : `${patients.length} patients · ${records.length} records`}
        actions={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
          >
            + Register patient
          </button>
        }
      />

      {(pError || rError) && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{pError ?? rError}</p>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total patients" value={patients.length} tone="indigo" />
        <StatTile label="High / critical" value={highRisk} tone="rose" />
        <StatTile label="Upcoming visits" value={withUpcoming} tone="emerald" />
        <StatTile label="Needs follow-up" value={needsFollowUp} tone="amber" />
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          options={[
            { value: "all", label: "All", count: patients.length },
            ...CRITICAL_LEVELS.map((l) => ({
              value: l as Filter,
              label: CRITICAL_META[l].label,
              count: counts[l],
            })),
          ]}
          value={filter}
          onChange={setFilter}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, ID, ward, condition…" />
      </div>

      {selected && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={selected.name} size="lg" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{selected.name}</h2>
                <Badge tone={CRITICAL_META[selected.criticalLevel].tone}>
                  {CRITICAL_META[selected.criticalLevel].label}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {[selected.age !== null && `${selected.age} yrs`, selected.category, selected.ward]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {selected.patientCode && <p className="font-mono text-xs text-gray-500">{selected.patientCode}</p>}
              {selected.condition && <p className="text-sm text-gray-500">{selected.condition}</p>}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
              <dt className="text-gray-500">Last visit</dt>
              <dd className="font-medium text-gray-900">
                {selectedSummary?.last ? formatDate(selectedSummary.last.scheduledAt.toDate()) : "—"}
              </dd>
              <dt className="text-gray-500">Next visit</dt>
              <dd className="font-medium text-gray-900">
                {selectedSummary?.next
                  ? `${formatDate(selectedSummary.next.scheduledAt.toDate())} · ${formatTime(selectedSummary.next.scheduledAt.toDate())}`
                  : "None"}
              </dd>
              <dt className="text-gray-500">Total visits</dt>
              <dd className="font-medium text-gray-900">{selectedSummary?.total ?? 0}</dd>
            </dl>
          </div>

          <div className="mt-5 border-t border-indigo-100 pt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Recent records</p>
            {selectedRecords.length === 0 ? (
              <p className="text-sm text-gray-500">No records yet.</p>
            ) : (
              <ul className="divide-y divide-indigo-100 rounded-xl bg-white">
                {selectedRecords.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium text-gray-900">{r.type}</span>
                      <span className="text-gray-600"> · {r.value}</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {r.recordedAt ? formatDate(r.recordedAt.toDate()) : "Saving…"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-indigo-100 pt-4">
            <button
              type="button"
              onClick={() => setRecordTarget({ id: selected.id, name: selected.name, patientCode: selected.patientCode })}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
            >
              Add record
            </button>
            <button
              type="button"
              onClick={() =>
                setScheduleTarget({
                  patientName: selected.name,
                  patientCode: selected.patientCode,
                  criticalLevel: selected.criticalLevel,
                  ward: selected.ward || undefined,
                })
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95"
            >
              Schedule visit
            </button>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="ml-auto rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Loading patients…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          title={patients.length === 0 ? "No patients yet" : "No patients match"}
          description={
            patients.length === 0
              ? "Register a patient or schedule a visit. Patients appear here automatically."
              : "Try a different level or search term."
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => {
            const isSelected = p.id === selectedId;
            const s = summaries.get(p.id);
            const meta = CRITICAL_META[p.criticalLevel];
            const count = recordsFor(p).length;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : p.id)}
                  aria-pressed={isSelected}
                  className={`w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition hover:shadow-md active:scale-[0.99] ${
                    isSelected ? "ring-2 ring-indigo-500" : "ring-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{p.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {[p.age !== null && `${p.age} yrs`, p.category, p.ward].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  {p.condition && <p className="mt-3 truncate text-sm text-gray-600">{p.condition}</p>}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {s?.total ?? 0} visits · {count} records
                    </span>
                    <span>{s?.next ? `Next: ${formatDate(s.next.scheduledAt.toDate())}` : "No visit scheduled"}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <AddPatientModal open={adding} onClose={() => setAdding(false)} />
      <NewVisitModal
        open={scheduleTarget !== null}
        onClose={() => setScheduleTarget(null)}
        prefill={scheduleTarget ?? undefined}
      />
      <AddRecordModal
        open={recordTarget !== null}
        onClose={() => setRecordTarget(null)}
        patient={recordTarget}
      />
    </PageShell>
  );
}