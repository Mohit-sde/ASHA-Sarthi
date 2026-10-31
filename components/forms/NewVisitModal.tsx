"use client";

import { useEffect, useState, type FormEvent } from "react";
import Modal, { FormField, FormFooter, inputClass } from "../ui/Modal";
import CriticalSelect from "./CriticalSelect";
import { useAuth } from "../../context/authContext";
import { addVisit } from "../../lib/firebase/db/visitService";
import { upsertPatient } from "../../lib/firebase/db/patientService";
import {
  VISIT_TYPES,
  WARDS,
  toDateInput,
  type CriticalLevel,
  type VisitType,
} from "../../lib/firebase/db/types";

export interface VisitPrefill {
  patientName?: string;
  patientCode?: string;
  criticalLevel?: CriticalLevel;
  ward?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date;
  prefill?: VisitPrefill;
}

const initialForm = (date: Date, p?: VisitPrefill) => ({
  patientName: p?.patientName ?? "",
  patientCode: p?.patientCode ?? "",
  criticalLevel: (p?.criticalLevel ?? "none") as CriticalLevel,
  type: VISIT_TYPES[0] as VisitType,
  ward: p?.ward ?? WARDS[0],
  date: toDateInput(date),
  time: "09:00",
  durationMin: 30,
  notes: "",
});
type Form = ReturnType<typeof initialForm>;

export default function NewVisitModal({ open, onClose, defaultDate, prefill }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<Form>(() => initialForm(defaultDate ?? new Date(), prefill));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialForm(defaultDate ?? new Date(), prefill));
      setError(null);
    }
    // Reset only when the modal opens, so edits aren't lost on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return setError("You are not signed in.");
    if (!form.patientName.trim()) return setError("Patient name is required.");
    const scheduledAt = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(scheduledAt.getTime())) return setError("Pick a valid date and time.");

    setSaving(true);
    setError(null);
    try {
      // Create or update the patient first, then link the visit to them.
      const patientId = await upsertPatient(user.uid, {
        name: form.patientName,
        patientCode: form.patientCode,
        criticalLevel: form.criticalLevel,
        ward: form.ward,
      });

      await addVisit(user.uid, {
        patientId,
        patientName: form.patientName,
        patientCode: form.patientCode,
        type: form.type,
        ward: form.ward,
        scheduledAt,
        durationMin: form.durationMin,
        notes: form.notes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save visit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule visit" description="Creates the patient if needed">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Patient name">
          <input className={inputClass} value={form.patientName} onChange={(e) => set("patientName", e.target.value)} placeholder="e.g. Demo Patient A" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Patient ID">
            <input className={inputClass} value={form.patientCode} onChange={(e) => set("patientCode", e.target.value)} placeholder="Optional" />
          </FormField>
          <CriticalSelect value={form.criticalLevel} onChange={(v) => set("criticalLevel", v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Visit type">
            <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as VisitType)}>
              {VISIT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Ward">
            <select className={inputClass} value={form.ward} onChange={(e) => set("ward", e.target.value)}>
              {WARDS.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => set("date", e.target.value)} />
          </FormField>
          <FormField label="Time">
            <input type="time" className={inputClass} value={form.time} onChange={(e) => set("time", e.target.value)} />
          </FormField>
        </div>
        <FormField label="Duration">
          <select className={inputClass} value={form.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))}>
            {[15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes">
          <textarea rows={3} className={inputClass} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" />
        </FormField>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <FormFooter saving={saving} onCancel={onClose} submitLabel="Schedule visit" />
      </form>
    </Modal>
  );
}