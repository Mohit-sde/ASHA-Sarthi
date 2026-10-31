"use client";

import { useState } from "react";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PageShell,
  SearchInput,
  Tabs,
  type Tone,
} from "../../../../components/ui/Kit";

type Category = "anc" | "child" | "adult" | "elderly";
type CareStatus = "on-track" | "due-soon" | "overdue";

interface Patient {
  id: string;
  name: string;
  age: number;
  village: string;
  category: Category;
  status: CareStatus;
  lastVisit: string;
  nextDue: string;
  condition: string;
}

const PATIENTS: Patient[] = [
  { id: "p1", name: "Demo Patient A", age: 34, village: "Ward 4", category: "adult", status: "on-track", lastVisit: "31 Oct", nextDue: "14 Nov", condition: "Hypertension monitoring" },
  { id: "p2", name: "Demo Patient B", age: 26, village: "Ward 4", category: "anc", status: "due-soon", lastVisit: "31 Oct", nextDue: "7 Nov", condition: "Pregnancy · 28 weeks" },
  { id: "p3", name: "Demo Patient C", age: 2, village: "Ward 7", category: "child", status: "due-soon", lastVisit: "30 Oct", nextDue: "2 Nov", condition: "Measles dose 2 pending" },
  { id: "p4", name: "Demo Patient D", age: 1, village: "Ward 7", category: "child", status: "on-track", lastVisit: "30 Oct", nextDue: "30 Apr", condition: "Growth monitoring" },
  { id: "p5", name: "Demo Patient E", age: 29, village: "Ward 9", category: "anc", status: "overdue", lastVisit: "29 Oct", nextDue: "Overdue 2 days", condition: "Pregnancy · 34 weeks" },
  { id: "p6", name: "Demo Patient F", age: 41, village: "Ward 2", category: "adult", status: "due-soon", lastVisit: "28 Oct", nextDue: "4 Nov", condition: "BP reading flagged" },
  { id: "p7", name: "Demo Patient G", age: 68, village: "Ward 2", category: "elderly", status: "on-track", lastVisit: "28 Oct", nextDue: "28 Nov", condition: "Routine elderly care" },
  { id: "p8", name: "Demo Patient H", age: 5, village: "Ward 5", category: "child", status: "on-track", lastVisit: "27 Oct", nextDue: "27 Jan", condition: "Polio booster complete" },
];

const STATUS_META: Record<CareStatus, { label: string; tone: Tone }> = {
  "on-track": { label: "On track", tone: "emerald" },
  "due-soon": { label: "Due soon", tone: "amber" },
  overdue: { label: "Overdue", tone: "rose" },
};

const CATEGORY_LABEL: Record<Category, string> = {
  anc: "ANC",
  child: "Child",
  adult: "Adult",
  elderly: "Elderly",
};

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = PATIENTS.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      `${p.name} ${p.village} ${p.condition}`.toLowerCase().includes(query.toLowerCase()),
  );

  const selected = PATIENTS.find((p) => p.id === selectedId) ?? null;
  const countOf = (c: Category) => PATIENTS.filter((p) => p.category === c).length;

  return (
    <PageShell>
      <PageHeader
        title="Patients"
        subtitle={`${PATIENTS.length} registered in your area (dummy)`}
        actions={
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
          >
            + Register patient
          </button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          options={[
            { value: "all", label: "All", count: PATIENTS.length },
            { value: "anc", label: "ANC", count: countOf("anc") },
            { value: "child", label: "Child", count: countOf("child") },
            { value: "adult", label: "Adult", count: countOf("adult") },
            { value: "elderly", label: "Elderly", count: countOf("elderly") },
          ]}
          value={category}
          onChange={setCategory}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, ward, condition…" />
      </div>

      {/* Detail panel */}
      {selected && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={selected.name} size="lg" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{selected.name}</h2>
                <Badge tone={STATUS_META[selected.status].tone}>{STATUS_META[selected.status].label}</Badge>
              </div>
              <p className="text-sm text-gray-600">
                {selected.age} yrs · {CATEGORY_LABEL[selected.category]} · {selected.village}
              </p>
              <p className="text-sm text-gray-500">{selected.condition}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
              <dt className="text-gray-500">Last visit</dt>
              <dd className="font-medium text-gray-900">{selected.lastVisit}</dd>
              <dt className="text-gray-500">Next due</dt>
              <dd className="font-medium text-gray-900">{selected.nextDue}</dd>
            </dl>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-indigo-100 pt-4">
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95">
              Record visit
            </button>
            <button type="button" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              View history
            </button>
            <button type="button" onClick={() => setSelectedId(null)} className="ml-auto rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              Close
            </button>
          </div>
        </Card>
      )}

      {visible.length === 0 ? (
        <EmptyState title="No patients found" description="Try a different category or search term." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => {
            const isSelected = p.id === selectedId;
            const meta = STATUS_META[p.status];
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
                        {p.age} yrs · {p.village}
                      </p>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  <p className="mt-3 truncate text-sm text-gray-600">{p.condition}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{CATEGORY_LABEL[p.category]}</span>
                    <span>Next: {p.nextDue}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}