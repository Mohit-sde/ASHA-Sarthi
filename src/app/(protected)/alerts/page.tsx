"use client";

import { useState } from "react";
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

type Severity = "critical" | "warning" | "info";

interface Alert {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  category: string;
  due: string;
}

const ALERTS: Alert[] = [
  { id: "a1", title: "ANC visit overdue", detail: "Demo Patient E · 2 days late", severity: "critical", category: "ANC", due: "Today" },
  { id: "a2", title: "Missed immunisation dose", detail: "Demo Patient C · Measles dose 2", severity: "critical", category: "Immunisation", due: "Yesterday" },
  { id: "a3", title: "3 immunisations due this week", detail: "Ward 7 · Demo batch 12", severity: "warning", category: "Immunisation", due: "This week" },
  { id: "a4", title: "High-risk pregnancy follow-up", detail: "Demo Patient F · BP reading flagged", severity: "warning", category: "ANC", due: "Tomorrow" },
  { id: "a5", title: "Records pending sync", detail: "2 visits from yesterday not uploaded", severity: "warning", category: "Records", due: "Today" },
  { id: "a6", title: "Growth monitoring reminder", detail: "Demo Patient D · 6-month check", severity: "info", category: "Child health", due: "Next week" },
  { id: "a7", title: "New training module available", detail: "Nutrition counselling refresher", severity: "info", category: "Training", due: "Any time" },
  { id: "a8", title: "Supply stock running low", detail: "ORS packets · 12 left in Ward 4", severity: "info", category: "Supplies", due: "This week" },
];

const SEVERITY_META: Record<Severity, { label: string; tone: Tone; border: string }> = {
  critical: { label: "Critical", tone: "rose", border: "border-l-rose-500" },
  warning: { label: "Warning", tone: "amber", border: "border-l-amber-500" },
  info: { label: "Info", tone: "indigo", border: "border-l-indigo-500" },
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [query, setQuery] = useState("");
  const [resolved, setResolved] = useState<string[]>([]);
  const [snoozed, setSnoozed] = useState<string[]>([]);

  const open = ALERTS.filter((a) => !resolved.includes(a.id));
  const countOf = (s: Severity) => open.filter((a) => a.severity === s).length;

  const visible = open.filter(
    (a) =>
      (filter === "all" || a.severity === filter) &&
      `${a.title} ${a.detail} ${a.category}`.toLowerCase().includes(query.toLowerCase()),
  );

  function resolve(id: string) {
    setResolved((prev) => [...prev, id]);
  }

  function toggleSnooze(id: string) {
    setSnoozed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <PageShell>
      <PageHeader
        title="Alerts"
        subtitle={`${open.length} open · ${countOf("critical")} critical (dummy)`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          options={[
            { value: "all", label: "All", count: open.length },
            { value: "critical", label: "Critical", count: countOf("critical") },
            { value: "warning", label: "Warning", count: countOf("warning") },
            { value: "info", label: "Info", count: countOf("info") },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search alerts…" />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={open.length === 0 ? "You're all caught up" : "No alerts match"}
          description={
            open.length === 0 ? "New alerts will appear here as they come in." : "Try a different filter or search term."
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((a) => {
            const meta = SEVERITY_META[a.severity];
            const isSnoozed = snoozed.includes(a.id);
            return (
              <li key={a.id}>
                <Card className={`border-l-4 ${meta.border} p-4 sm:p-5`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <Badge>{a.category}</Badge>
                        {isSnoozed && <Badge tone="gray">Snoozed</Badge>}
                      </div>
                      <p className="font-semibold text-gray-900">{a.title}</p>
                      <p className="text-sm text-gray-500">{a.detail}</p>
                      <p className="text-xs text-gray-400">Due: {a.due}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSnooze(a.id)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95"
                      >
                        {isSnoozed ? "Unsnooze" : "Snooze"}
                      </button>
                      <button
                        type="button"
                        onClick={() => resolve(a.id)}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
                      >
                        Mark resolved
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}