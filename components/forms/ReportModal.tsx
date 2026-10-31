"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { Badge, StatTile, type Tone } from "../ui/Kit";
import { useVisitsBetween } from "../../hooks/useVisits";
import { VISIT_TYPES, displayStatus, formatTime, startOfDay } from "../../lib/firebase/db/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export default function ReportModal({ open, onClose }: Props) {
  const [days, setDays] = useState(7);
  const from = startOfDay(1 - days);
  const to = startOfDay(1);
  const { visits, loading, error } = useVisitsBetween(from, to);

  const now = new Date();
  const total = visits.length;
  const completed = visits.filter((v) => displayStatus(v, now) === "completed").length;
  const missed = visits.filter((v) => displayStatus(v, now) === "missed").length;
  const open_ = visits.filter((v) => ["scheduled", "overdue"].includes(displayStatus(v, now))).length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const byType = VISIT_TYPES.map((t) => ({ type: t, count: visits.filter((v) => v.type === t).length }));
  const maxCount = Math.max(1, ...byType.map((b) => b.count));

  function exportCsv() {
    const header = ["Date", "Time", "Patient", "Patient ID", "Type", "Ward", "Status"];
    const rows = visits.map((v) => {
      const d = v.scheduledAt.toDate();
      return [d.toLocaleDateString("en-IN"), formatTime(d), v.patientName, v.patientCode, v.type, v.ward, displayStatus(v, now)];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `visits-last-${days}-days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal open={open} onClose={onClose} title="Visit report" description="Summary of your visits">
      <div className="space-y-5">
        <div className="inline-flex rounded-xl bg-gray-100 p-1 text-sm">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                days === r.days ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Total visits" value={total} tone="indigo" />
          <StatTile label="Completion rate" value={`${rate}%`} tone="emerald" />
          <StatTile label="Open" value={open_} tone="amber" />
          <StatTile label="Missed" value={missed} tone="rose" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">By visit type</p>
          {byType.map((b) => (
            <div key={b.type} className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{b.type}</span>
                <span>{b.count}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(b.count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <Badge>{loading ? "Loading…" : `${total} records in range`}</Badge>
          <button
            type="button"
            onClick={exportCsv}
            disabled={total === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 active:scale-95"
          >
            Export CSV
          </button>
        </div>
      </div>
    </Modal>
  );
}