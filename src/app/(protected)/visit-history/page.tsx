"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/authContext";
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
import { subscribeAllVisits } from "../../../../lib/firebase/db/visitService";
import {
  displayStatus,
  formatTime,
  type DisplayStatus,
  type VisitDoc,
} from "../../../../lib/firebase/db/types";

const STATUS_META: Record<DisplayStatus, { label: string; tone: Tone }> = {
  scheduled: { label: "Scheduled", tone: "indigo" },
  overdue: { label: "Overdue", tone: "amber" },
  completed: { label: "Completed", tone: "emerald" },
  missed: { label: "Missed", tone: "rose" },
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function VisitHistoryPage() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<VisitDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | DisplayStatus>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    return subscribeAllVisits(
      user.uid,
      (v) => {
        setVisits(v);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [user]);

  const now = useMemo(() => new Date(), [visits]);

  const withStatus = useMemo(
    () => visits.map((v) => ({ visit: v, status: displayStatus(v, now) })),
    [visits, now],
  );

  const counts = useMemo(() => {
    const c: Record<DisplayStatus, number> = { scheduled: 0, overdue: 0, completed: 0, missed: 0 };
    withStatus.forEach((x) => c[x.status]++);
    return c;
  }, [withStatus]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withStatus.filter(
      ({ visit, status }) =>
        (filter === "all" || status === filter) &&
        `${visit.patientName} ${visit.patientCode} ${visit.type} ${visit.ward}`
          .toLowerCase()
          .includes(q),
    );
  }, [withStatus, filter, query]);

  return (
    <PageShell>
      <PageHeader
        title="Visit history"
        subtitle={loading ? "Loading…" : `${visits.length} visits on your account`}
      />

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            options={[
              { value: "all", label: "All", count: visits.length },
              { value: "scheduled", label: "Scheduled", count: counts.scheduled },
              { value: "overdue", label: "Overdue", count: counts.overdue },
              { value: "completed", label: "Completed", count: counts.completed },
              { value: "missed", label: "Missed", count: counts.missed },
            ]}
            value={filter}
            onChange={setFilter}
          />
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search patient, ID, ward…"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading visits…</p>
        ) : visible.length === 0 ? (
          <EmptyState
            title={visits.length === 0 ? "No visits yet" : "No visits match"}
            description={
              visits.length === 0
                ? "Visits you schedule will appear here."
                : "Try a different status or search term."
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Patient</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Ward</th>
                    <th className="py-3 pr-4 font-medium">Duration</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map(({ visit: v, status }) => {
                    const d = v.scheduledAt.toDate();
                    return (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 text-gray-500">
                          {formatDate(d)}
                          <span className="block text-xs">{formatTime(d)}</span>
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {v.patientName}
                          {v.patientCode && (
                            <span className="block text-xs font-normal text-gray-500">
                              {v.patientCode}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">{v.type}</td>
                        <td className="py-3 pr-4 text-gray-500">{v.ward}</td>
                        <td className="py-3 pr-4 text-gray-500">{v.durationMin} min</td>
                        <td className="py-3 pr-4">
                          <Badge tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Badge>
                        </td>
                        <td className="max-w-xs py-3 text-gray-500">{v.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {visible.map(({ visit: v, status }) => {
                const d = v.scheduledAt.toDate();
                return (
                  <li key={v.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{v.patientName}</p>
                        <p className="text-xs text-gray-500">
                          {v.type} · {v.ward}
                        </p>
                      </div>
                      <Badge tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Badge>
                    </div>
                    {v.notes && <p className="mt-2 text-sm text-gray-500">{v.notes}</p>}
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(d)} · {formatTime(d)} · {v.durationMin} min
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </PageShell>
  );
}