"use client";

import { useCallback, useState } from "react";
import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { signOutUser } from "../../lib/firebase/auth/service";
import type { WorkerProfile } from "../../types/auth";
import NewVisitModal from "../forms/NewVisitModal";
import AddRecordModal from "../forms/AddRecordModal";
import ReportModal from "../forms/ReportModal";
import ScanIdModal from "../forms/ScanIdModal";
import { useVisitsForDay } from "../../hooks/useVisits";
import { displayStatus, formatTime, type DisplayStatus } from "../../lib/firebase/db/types";

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

type Tone = "indigo" | "emerald" | "amber" | "rose";

const TONES: Record<Tone, { bg: string; text: string; bar: string; stroke: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", bar: "bg-indigo-500", stroke: "#6366f1" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500", stroke: "#10b981" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500", stroke: "#f59e0b" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", bar: "bg-rose-500", stroke: "#f43f5e" },
};

const STATUS_STYLE: Record<DisplayStatus, { label: string; chip: string; dot: string }> = {
  completed: { label: "Completed", chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  scheduled: { label: "Scheduled", chip: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  overdue: { label: "Overdue", chip: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  missed: { label: "Missed", chip: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
};

// Trend and coverage stay dummy until their services exist.
const TREND: Record<"Visits" | "Target", number[]> = {
  Visits: [2, 3, 2, 5, 4, 6, 4],
  Target: [1, 2, 2, 3, 2, 3, 3],
};

const COVERAGE = [
  { label: "Household visits", done: 62, total: 80, tone: "indigo" as Tone },
  { label: "ANC check-ups", done: 18, total: 24, tone: "rose" as Tone },
  { label: "Immunisations", done: 41, total: 50, tone: "emerald" as Tone },
  { label: "Records synced", done: 29, total: 35, tone: "amber" as Tone },
];

const ALERTS: { title: string; detail: string; tone: Tone }[] = [
  { title: "3 immunisations due this week", detail: "Ward 7 · Demo batch 12", tone: "amber" },
  { title: "1 ANC visit overdue", detail: "Demo Patient E · 2 days late", tone: "rose" },
  { title: "Records pending sync", detail: "2 visits from yesterday", tone: "indigo" },
];

const QUICK_ACTIONS = [
  { label: "New visit", icon: "+", key: "visit" },
  { label: "Scan ID", icon: "⌗", key: "scan" },
  { label: "Add record", icon: "✎", key: "record" },
  { label: "Report", icon: "▤", key: "report" },
] as const;

type ModalKey = (typeof QUICK_ACTIONS)[number]["key"];

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function Sparkline({ data, stroke }: { data: number[]; stroke: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 26 - ((v - min) / range) * 22;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ProgressRing({ value, max, size = 120, strokeWidth = 12 }: { value: number; max: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max === 0 ? 0 : Math.min(value / max, 1);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#6366f1"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {value}/{max}
        </span>
        <span className="text-xs text-gray-500">visits today</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, total, tone }: { value: number; total: number; tone: Tone }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${TONES[tone].bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TrendChart({ visits, target }: { visits: number[]; target: number[] }) {
  const max = Math.max(...visits, ...target, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="flex h-48 items-end gap-2 sm:gap-4">
      {visits.map((v, i) => (
        <div key={days[i]} className="flex h-full flex-1 flex-col items-center gap-2">
          <div className="relative flex w-full flex-1 items-end justify-center">
            <div
              className="absolute bottom-0 w-full max-w-[36px] rounded-t-md border-2 border-dashed border-gray-300"
              style={{ height: `${(target[i] / max) * 100}%` }}
              aria-hidden
            />
            <div
              className="relative w-full max-w-[36px] rounded-t-md bg-indigo-500 transition-all duration-500"
              style={{ height: `${(v / max) * 100}%` }}
              title={`${v} visits`}
            />
          </div>
          <span className="text-xs text-gray-500">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

interface Props {
  user: User;
  profile: WorkerProfile | null;
}

export default function WorkerDashboard({ user, profile }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalKey | null>(null);
  const closeModal = useCallback(() => setModal(null), []);

  const { visits, loading, error } = useVisitsForDay(new Date());
  const now = new Date();
  const statuses = visits.map((v) => displayStatus(v, now));
  const countOf = (s: DisplayStatus) => statuses.filter((x) => x === s).length;

  const completedToday = countOf("completed");
  const todayTotal = visits.length;
  const openCount = countOf("scheduled") + countOf("overdue");
  const nextVisit = visits.find((v) => ["scheduled", "overdue"].includes(displayStatus(v, now)));

  const SUMMARY = [
    { label: "Visits today", value: todayTotal, change: 0, tone: "indigo" as Tone, trend: [2, 3, 2, 5, 4, 6, 4] },
    { label: "Open visits", value: openCount, change: 0, tone: "amber" as Tone, trend: [5, 4, 4, 3, 3, 2, 2] },
    { label: "Completed", value: completedToday, change: 0, tone: "emerald" as Tone, trend: [1, 2, 2, 3, 2, 3, 3] },
    { label: "Missed", value: countOf("missed"), change: 0, tone: "rose" as Tone, trend: [1, 2, 1, 1, 2, 1, 1] },
  ];

  const name = profile?.displayName ?? user.displayName ?? "ASHA worker";
  const method = profile?.provider === "google" ? "Google" : "ASHA ID";
  const role = profile?.role ?? "asha";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  async function handleSignOut() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <div className="pb-28 md:pb-10">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {initialsOf(name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{today}</p>
              <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">Welcome, {name}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <p className="text-xs text-gray-500 sm:text-sm">
          Role: <span className="font-medium text-gray-700">{role}</span> · Signed in with{" "}
          <span className="font-medium text-gray-700">{method}</span>
          {profile?.ashaId && (
            <>
              {" "}· <span className="font-mono">{profile.ashaId}</span>
            </>
          )}
        </p>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {/* Hero */}
        <section className="grid gap-4 md:grid-cols-5">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 md:col-span-2 md:flex-row md:items-center md:gap-6">
            <ProgressRing value={completedToday} max={todayTotal} />
            <div className="w-full space-y-2 text-center md:text-left">
              <h2 className="font-semibold text-gray-900">Today&apos;s progress</h2>
              <p className="text-sm text-gray-500">
                {loading ? "Loading…" : `${completedToday} of ${todayTotal} visits completed`}
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                {countOf("overdue") === 0 ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">On track</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    {countOf("overdue")} overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white shadow-sm md:col-span-3">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />
            <p className="text-xs uppercase tracking-wider text-indigo-200">Up next</p>
            {nextVisit ? (
              <>
                <h3 className="mt-1 text-xl font-semibold">
                  {nextVisit.patientName} · {nextVisit.type}
                </h3>
                <p className="mt-1 text-sm text-indigo-100">
                  {formatTime(nextVisit.scheduledAt.toDate())} · {nextVisit.ward} · {nextVisit.durationMin} min
                </p>
              </>
            ) : (
              <h3 className="mt-1 text-xl font-semibold">No visits left today</h3>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setModal("visit")}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 active:scale-95"
              >
                Schedule visit
              </button>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => setModal(action.key)}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-200 hover:ring-indigo-300 active:scale-95"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-lg font-semibold text-indigo-600">
                {action.icon}
              </span>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </section>

        {/* Stat cards */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SUMMARY.map((item) => {
            const tone = TONES[item.tone];
            return (
              <div key={item.label} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-xs font-medium text-gray-500 sm:text-sm">{item.label}</p>
                <p className={`text-3xl font-bold ${tone.text}`}>{item.value}</p>
                <Sparkline data={item.trend} stroke={tone.stroke} />
              </div>
            );
          })}
        </section>

        {/* Analytics */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Visit analytics</h2>
              <p className="text-sm text-gray-500">This week (dummy trend)</p>
            </div>
            <button
              type="button"
              onClick={() => setModal("report")}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Full report
            </button>
          </div>
          <div className="mt-6">
            <TrendChart visits={TREND.Visits} target={TREND.Target} />
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-gray-400" /> Target
            </span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Coverage */}
          <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div>
              <h2 className="font-semibold text-gray-900">Monthly coverage</h2>
              <p className="text-sm text-gray-500">Progress against targets (dummy)</p>
            </div>
            {COVERAGE.map((c) => {
              const pct = Math.round((c.done / c.total) * 100);
              return (
                <div key={c.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{c.label}</span>
                    <span className="text-gray-500">
                      {c.done}/{c.total} · <span className={TONES[c.tone].text}>{pct}%</span>
                    </span>
                  </div>
                  <ProgressBar value={c.done} total={c.total} tone={c.tone} />
                </div>
              );
            })}
          </section>

          {/* Alerts */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Alerts</h2>
                <p className="text-sm text-gray-500">Needs your attention (dummy)</p>
              </div>
              <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white">{ALERTS.length}</span>
            </div>
            <ul className="space-y-3">
              {ALERTS.map((alert) => (
                <li key={alert.title} className={`flex gap-3 rounded-xl p-3 ${TONES[alert.tone].bg}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONES[alert.tone].bar}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-500">{alert.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Live schedule */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Today&apos;s schedule</h2>
              <p className="text-sm text-gray-500">{todayTotal} visits planned</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/schedule")}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              See all
            </button>
          </div>
          <ol className="relative space-y-5 border-l-2 border-gray-100 pl-6">
            {loading && <li className="text-sm text-gray-500">Loading visits…</li>}
            {!loading && visits.length === 0 && <li className="text-sm text-gray-500">No visits planned today.</li>}
            {visits.map((v) => {
              const status = displayStatus(v, now);
              const style = STATUS_STYLE[status];
              return (
                <li key={v.id} className="relative">
                  <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${style.dot}`} />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {v.patientName} · {v.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(v.scheduledAt.toDate())} · {v.ward}
                      </p>
                    </div>
                    <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${style.chip}`}>
                      {style.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-4">
          {[
            { label: "Home", href: "/dashboard", active: true },
            { label: "Patients", href: "/patients", active: false },
            { label: "Schedule", href: "/schedule", active: false },
            { label: "Profile", href: "/profile", active: false },
          ].map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => router.push(item.href)}
                className={`flex w-full flex-col items-center gap-1 py-3 text-xs font-medium ${
                  item.active ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                <span className={`h-1 w-6 rounded-full ${item.active ? "bg-indigo-600" : "bg-transparent"}`} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Modals */}
      <NewVisitModal open={modal === "visit"} onClose={closeModal} />
      <AddRecordModal open={modal === "record"} onClose={closeModal} />
      <ReportModal open={modal === "report"} onClose={closeModal} />
      <ScanIdModal open={modal === "scan"} onClose={closeModal} />
    </div>
  );
}