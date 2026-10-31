import type { Timestamp } from "firebase/firestore";

export const COLLECTIONS = { visits: "visits", records: "records", patients: "patients" } as const;

export const VISIT_TYPES = [
  "Home visit",
  "ANC check-up",
  "Immunisation",
  "Growth monitoring",
  "Follow-up visit",
] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const RECORD_TYPES = ["Vitals", "Immunisation", "ANC", "Growth", "Referral", "Other"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const WARDS = Array.from({ length: 9 }, (_, i) => `Ward ${i + 1}`);

export const PATIENT_CATEGORIES = ["ANC", "Child", "Adult", "Elderly"] as const;
export type PatientCategory = (typeof PATIENT_CATEGORIES)[number];

export const CRITICAL_LEVELS = ["none", "low", "moderate", "high", "critical"] as const;
export type CriticalLevel = (typeof CRITICAL_LEVELS)[number];

export const CRITICAL_META: Record<
  CriticalLevel,
  { label: string; rank: number; tone: "gray" | "emerald" | "amber" | "rose" }
> = {
  none: { label: "None", rank: 0, tone: "gray" },
  low: { label: "Low", rank: 1, tone: "emerald" },
  moderate: { label: "Moderate", rank: 2, tone: "amber" },
  high: { label: "High", rank: 3, tone: "amber" },
  critical: { label: "Critical", rank: 4, tone: "rose" },
};

// ---------- Patients ----------
export interface PatientDoc {
  id: string;
  ashaUid: string;
  name: string;
  nameLower: string;
  patientCode: string;
  age: number | null;
  category: PatientCategory | null;
  ward: string;
  condition: string;
  criticalLevel: CriticalLevel;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PatientInput {
  name: string;
  patientCode?: string;
  age?: number | null;
  category?: PatientCategory;
  ward?: string;
  condition?: string;
  criticalLevel?: CriticalLevel;
}

// ---------- Visits ----------
export type VisitStatus = "scheduled" | "completed" | "missed";

export interface VisitDoc {
  id: string;
  ashaUid: string;
  patientId: string | null;
  patientName: string;
  patientCode: string;
  type: VisitType;
  ward: string;
  scheduledAt: Timestamp;
  durationMin: number;
  status: VisitStatus;
  notes: string;
}

export interface NewVisitInput {
  patientId: string;
  patientName: string;
  patientCode: string;
  type: VisitType;
  ward: string;
  scheduledAt: Date;
  durationMin: number;
  notes: string;
}

// ---------- Records ----------
export interface RecordDoc {
  id: string;
  ashaUid: string;
  patientId: string | null;
  patientName: string;
  patientCode: string;
  type: RecordType;
  value: string;
  notes: string;
  recordedAt: Timestamp | null; // null until the server timestamp resolves
}

export interface NewRecordInput {
  patientId: string;
  patientName: string;
  patientCode: string;
  type: RecordType;
  value: string;
  notes: string;
}

// ---------- Derived status ----------
export type DisplayStatus = "scheduled" | "overdue" | "completed" | "missed";

export function displayStatus(v: Pick<VisitDoc, "status" | "scheduledAt">, now = new Date()): DisplayStatus {
  if (v.status === "completed") return "completed";
  if (v.status === "missed") return "missed";
  return v.scheduledAt.toDate() < now ? "overdue" : "scheduled";
}

// ---------- Date helpers ----------
export function startOfDay(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

export const formatTime = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const formatDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const pad = (n: number) => String(n).padStart(2, "0");
export const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;