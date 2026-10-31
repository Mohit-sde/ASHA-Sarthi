"use client";

import type { ReactNode } from "react";

export type Tone = "gray" | "indigo" | "emerald" | "amber" | "rose";

const BADGE_TONE: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700",
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};

const BAR_TONE: Record<Tone, string> = {
  gray: "bg-gray-400",
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

const TEXT_TONE: Record<Tone, string> = {
  gray: "text-gray-700",
  indigo: "text-indigo-600",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
};

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl space-y-6 p-4 pb-28 sm:p-6 md:pb-10">{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 ${className}`}>
      {children}
    </section>
  );
}

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONE[tone]}`}>
      {children}
    </span>
  );
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" className="inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-gray-100 p-1 text-sm">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? "bg-indigo-50 text-indigo-700" : "bg-gray-200 text-gray-600"
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

export function ProgressBar({ value, max, tone = "indigo" }: { value: number; max: number; tone?: Tone }) {
  const pct = max === 0 ? 0 : Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={pct}>
      <div className={`h-full rounded-full transition-all duration-700 ${BAR_TONE[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${sizeClass}`}>
      {initialsOf(name)}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${TEXT_TONE[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </Card>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? "bg-indigo-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}