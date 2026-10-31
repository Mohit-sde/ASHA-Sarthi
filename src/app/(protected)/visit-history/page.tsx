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

type Outcome = "completed" | "follow-up" | "missed";

interface HistoryRow {
  id: string;
  date: string;
  patient: string;
  type: string;
  outcome: Outcome;
  ward: string;
  notes: string;
}

const ROWS: HistoryRow[] = [
  { id: "v01", date: "31 Oct 2026", patient: "Demo Patient A", type: "Home visit", outcome: "completed", ward: "Ward 4", notes: "Routine check. Vitals normal." },
  { id: "v02", date: "31 Oct 2026", patient: "Demo Patient B", type: "ANC check-up", outcome: "follow-up", ward: "Ward 4", notes: "Iron tablets refilled. Review in 2 weeks." },
  { id: "v03", date: "30 Oct 2026", patient: "Demo Patient C", type: "Immunisation", outcome: "completed", ward: "Ward 7", notes: "Measles dose 1 given." },
  { id: "v04", date: "30 Oct 2026", patient: "Demo Patient D", type: "Growth monitoring", outcome: "completed", ward: "Ward 7", notes: "Weight and height recorded." },
  { id: "v05", date: "29 Oct 2026", patient: "Demo Patient E", type: "Follow-up visit", outcome: "missed", ward: "Ward 9", notes: "Household locked. Rescheduled." },
  { id: "v06", date: "28 Oct 2026", patient: "Demo Patient F", type: "ANC check-up", outcome: "follow-up", ward: "Ward 2", notes: "BP reading flagged. Referred to PHC." },
  { id: "v07", date: "28 Oct 2026", patient: "Demo Patient G", type: "Home visit", outcome: "completed", ward: "Ward 2", notes: "Counselling on nutrition." },
  { id: "v08", date: "27 Oct 2026", patient: "Demo Patient H", type: "Immunisation", outcome: "completed", ward: "Ward 5", notes: "Polio booster given." },
  { id: "v09", date: "27 Oct 2026", patient: "Demo Patient I", type: "Growth monitoring", outcome: "missed", ward: "Ward 5", notes: "Patient not available." },
  { id: "v10", date: "26 Oct 2026", patient: "Demo Patient J", type: "Home visit", outcome: "completed", ward: "Ward 5", notes: "Discharge follow-up done." },
  { id: "v11", date: "25 Oct 2026", patient: "Demo Patient K", type: "Immunisation", outcome: "completed", ward: "Ward 1", notes: "BCG administered." },
  { id: "v12", date: "24 Oct 2026", patient: "Demo Patient L", type: "ANC check-up", outcome: "follow-up", ward: "Ward 1", notes: "Ultrasound advised." },
];

const OUTCOME_META: Record<Outcome, { label: string; tone: Tone }> = {
  completed: { label: "Completed", tone: "emerald" },
  "follow-up": { label: "Follow-up", tone: "amber" },
  missed: { label: "Missed", tone: "rose" },
};

const TYPES = ["All types", ...Array.from(new Set(ROWS.map((r) => r.type)))];
const PAGE_SIZE = 5;

export default function VisitHistoryPage() {
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<"all" | Outcome>("all");
  const [type, setType] = useState("All types");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      ROWS.filter(
        (r) =>
          (outcome === "all" || r.outcome === outcome) &&
          (type === "All types" || r.type === type) &&
          `${r.patient} ${r.notes} ${r.ward}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, outcome, type],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function changeFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <PageShell>
      <PageHeader title="Visit history" subtitle={`${filtered.length} visits found (dummy)`} />

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            options={[
              { value: "all", label: "All", count: ROWS.length },
              { value: "completed", label: "Completed", count: ROWS.filter((r) => r.outcome === "completed").length },
              { value: "follow-up", label: "Follow-up", count: ROWS.filter((r) => r.outcome === "follow-up").length },
              { value: "missed", label: "Missed", count: ROWS.filter((r) => r.outcome === "missed").length },
            ]}
            value={outcome}
            onChange={changeFilter(setOutcome)}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={type}
              onChange={(e) => changeFilter(setType)(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <SearchInput value={query} onChange={changeFilter(setQuery)} placeholder="Search patient or notes…" />
          </div>
        </div>

        {pageRows.length === 0 ? (
          <EmptyState title="No visits match" description="Adjust the filters or clear the search." />
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
                    <th className="py-3 pr-4 font-medium">Outcome</th>
                    <th className="py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 text-gray-500">{r.date}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{r.patient}</td>
                      <td className="py-3 pr-4 text-gray-700">{r.type}</td>
                      <td className="py-3 pr-4 text-gray-500">{r.ward}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={OUTCOME_META[r.outcome].tone}>{OUTCOME_META[r.outcome].label}</Badge>
                      </td>
                      <td className="max-w-xs py-3 text-gray-500">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {pageRows.map((r) => (
                <li key={r.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{r.patient}</p>
                      <p className="text-xs text-gray-500">
                        {r.type} · {r.ward}
                      </p>
                    </div>
                    <Badge tone={OUTCOME_META[r.outcome].tone}>{OUTCOME_META[r.outcome].label}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{r.notes}</p>
                  <p className="mt-2 text-xs text-gray-400">{r.date}</p>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
              <p className="text-gray-500">
                Page {currentPage} of {pageCount}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
}