import {
  CRITICAL_META,
  displayStatus,
  formatTime,
  type PatientDoc,
  type VisitDoc,
} from "../firebase/db/types";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory = "Visit" | "Patient" | "Schedule";

export interface AppAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  detail: string;
  action: "complete" | "schedule" | null;
  visitId: string | null;
  patient: PatientDoc | null;
}

const DAY = 24 * 60 * 60 * 1000;
const ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function buildAlerts(visits: VisitDoc[], patients: PatientDoc[], now = new Date()): AppAlert[] {
  const alerts: AppAlert[] = [];
  const t = now.getTime();

  for (const v of visits) {
    const status = displayStatus(v, now);
    const when = v.scheduledAt.toDate();

    if (status === "overdue") {
      alerts.push({
        id: `overdue-${v.id}`,
        severity: "critical",
        category: "Visit",
        title: `${v.type} overdue`,
        detail: `${v.patientName} · ${v.ward} · was due ${formatTime(when)}`,
        action: "complete",
        visitId: v.id,
        patient: null,
      });
    } else if (status === "missed" && t - when.getTime() < 7 * DAY) {
      alerts.push({
        id: `missed-${v.id}`,
        severity: "warning",
        category: "Visit",
        title: `Missed ${v.type.toLowerCase()}`,
        detail: `${v.patientName} · ${v.ward}`,
        action: null,
        visitId: v.id,
        patient: null,
      });
    } else if (status === "scheduled" && when.getTime() - t < DAY) {
      alerts.push({
        id: `soon-${v.id}`,
        severity: "info",
        category: "Schedule",
        title: `${v.type} within 24 hours`,
        detail: `${v.patientName} · ${v.ward} · ${formatTime(when)}`,
        action: null,
        visitId: v.id,
        patient: null,
      });
    }
  }

  // Patients with high or critical levels and no upcoming visit.
  const followedUp = new Set(
    visits
      .filter((v) => ["scheduled", "overdue"].includes(displayStatus(v, now)))
      .map((v) => v.patientId)
      .filter(Boolean),
  );

  for (const p of patients) {
    const meta = CRITICAL_META[p.criticalLevel];
    if (meta.rank >= 3 && !followedUp.has(p.id)) {
      alerts.push({
        id: `nofollow-${p.id}`,
        severity: meta.rank === 4 ? "critical" : "warning",
        category: "Patient",
        title: "No follow-up scheduled",
        detail: `${p.name} · ${meta.label} condition`,
        action: "schedule",
        visitId: null,
        patient: p,
      });
    }
  }

  return alerts.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}