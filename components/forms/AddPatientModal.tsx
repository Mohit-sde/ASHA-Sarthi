"use client";

import { useEffect, useState, type FormEvent } from "react";
import Modal, { FormField, FormFooter, inputClass } from "../ui/Modal";
import CriticalSelect from "./CriticalSelect";
import { useAuth } from "../../context/authContext";
import { upsertPatient } from "../../lib/firebase/db/patientService";
import {
  PATIENT_CATEGORIES,
  WARDS,
  type CriticalLevel,
  type PatientCategory,
} from "../../lib/firebase/db/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY = {
  name: "",
  patientCode: "",
  age: "",
  category: "Adult" as PatientCategory,
  ward: WARDS[0],
  criticalLevel: "none" as CriticalLevel,
  condition: "",
};
type Form = typeof EMPTY;

export default function AddPatientModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return setError("You are not signed in.");
    if (!form.name.trim()) return setError("Patient name is required.");

    const age = form.age.trim() === "" ? null : Number(form.age);
    if (age !== null && (Number.isNaN(age) || age < 0 || age > 130)) return setError("Enter a valid age.");

    setSaving(true);
    setError(null);
    try {
      await upsertPatient(user.uid, {
        name: form.name,
        patientCode: form.patientCode,
        age,
        category: form.category,
        ward: form.ward,
        condition: form.condition,
        criticalLevel: form.criticalLevel,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save patient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register patient"
      description="Existing patients with the same ID or name are updated."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Patient name">
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Patient ID">
            <input className={inputClass} value={form.patientCode} onChange={(e) => set("patientCode", e.target.value)} placeholder="Optional" />
          </FormField>
          <FormField label="Age">
            <input type="number" min={0} max={130} className={inputClass} value={form.age} onChange={(e) => set("age", e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category">
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value as PatientCategory)}>
              {PATIENT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
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
        <CriticalSelect value={form.criticalLevel} onChange={(v) => set("criticalLevel", v)} />
        <FormField label="Condition">
          <textarea rows={2} className={inputClass} value={form.condition} onChange={(e) => set("condition", e.target.value)} placeholder="e.g. Hypertension, 28 weeks pregnant" />
        </FormField>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <FormFooter saving={saving} onCancel={onClose} submitLabel="Save patient" />
      </form>
    </Modal>
  );
}