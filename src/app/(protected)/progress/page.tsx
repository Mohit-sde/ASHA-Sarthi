"use client";

import { useState } from "react";
import {
  Badge,
  Card,
  PageHeader,
  PageShell,
  ProgressBar,
  StatTile,
  Tabs,
  type Tone,
} from "../../../../components/ui/Kit";

type Period = "month" | "quarter";

const STATS: Record<Period, { completion: number; streak: number; households: string; avgPerDay: number }> = {
  month: { completion: 86, streak: 9, households: "62/80", avgPerDay: 5.2 },
  quarter: { completion: 81, streak: 9, households: "174/230", avgPerDay: 4.8 },
};

const GOALS: { label: string; done: number; total: number; tone: Tone }[] = [
  { label: "Household visits", done: 62, total: 80, tone: "indigo" },
  { label: "ANC check-ups", done: 18, total: 24, tone: "rose" },
  { label: "Immunisations", done: 41, total: 50, tone: "emerald" },
  { label: "Nutrition counselling", done: 12, total: 20, tone: "amber" },
];

const TREND = [
  { month: "May", value: 42 },
  { month: "Jun", value: 55 },
  { month: "Jul", value: 48 },
  { month: "Aug", value: 63 },
  { month: "Sep", value: 70 },
  { month: "Oct", value: 78 },
];

const MILESTONES = [
  { title: "First 50 visits completed", done: true },
  { title: "No overdue ANC follow-ups for one week", done: true },
  { title: "Complete all Ward 7 immunisations", done: false },
  { title: "Sync all pending records", done: false },
];

function TrendChart({ data }: { data: { month: string; value: number }[] }) {
  const W = 600;
  const H = 200;
  const PAD = 16;
  const step = W / (data.length - 1);
  const points = data.map((d, i) => ({
    x: i * step,
    y: H - PAD - (d.value / 100) * (H - PAD * 2),
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#e5e7eb" strokeDasharray="4 4" />
        ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={line} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#6366f1" strokeWidth="2.5" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [period, setPeriod] = useState<Period>("month");
  const s = STATS[period];

  return (
    <PageShell>
      <PageHeader
        title="Progress"
        subtitle="Your performance against targets (dummy)"
        actions={
          <Tabs
            options={[
              { value: "month", label: "This month" },
              { value: "quarter", label: "This quarter" },
            ]}
            value={period}
            onChange={setPeriod}
          />
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Completion rate" value={`${s.completion}%`} hint="Visits completed on plan" tone="emerald" />
        <StatTile label="Current streak" value={`${s.streak} days`} hint="Days with no overdue visits" tone="indigo" />
        <StatTile label="Households covered" value={s.households} hint="Against monthly target" tone="amber" />
        <StatTile label="Avg visits / day" value={s.avgPerDay} hint="Working days only" tone="rose" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Goal progress</h2>
            <p className="text-sm text-gray-500">Remaining work per target</p>
          </div>
          {GOALS.map((g) => {
            const left = g.total - g.done;
            const pct = Math.round((g.done / g.total) * 100);
            return (
              <div key={g.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{g.label}</span>
                  <span className="text-gray-500">
                    {g.done}/{g.total} · {pct}%
                  </span>
                </div>
                <ProgressBar value={g.done} max={g.total} tone={g.tone} />
                <p className="text-xs text-gray-500">{left} remaining this month</p>
              </div>
            );
          })}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900">Completion trend</h2>
            <p className="text-sm text-gray-500">Last 6 months (dummy)</p>
          </div>
          <TrendChart data={TREND} />
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Milestones</h2>
            <p className="text-sm text-gray-500">
              {MILESTONES.filter((m) => m.done).length} of {MILESTONES.length} achieved
            </p>
          </div>
          <Badge tone="indigo">Q4 goals</Badge>
        </div>
        <ul className="divide-y divide-gray-100">
          {MILESTONES.map((m) => (
            <li key={m.title} className="flex items-center gap-3 py-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {m.done ? "✓" : ""}
              </span>
              <span className={`text-sm ${m.done ? "text-gray-500 line-through" : "text-gray-900"}`}>{m.title}</span>
            </li>
          ))}
        </ul>
      </Card>
    </PageShell>
  );
}