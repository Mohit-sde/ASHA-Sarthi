"use client";

import { useEffect, useState, type FormEvent } from "react";
import Modal, { FormField, FormFooter, inputClass } from "../ui/Modal";
import { useAuth } from "../../context/authContext";
import { usePatients } from "../../hooks/useWorkerData";
import { addRecord } from "../../lib/firebase/db/recordService";
import { RECORD_TYPES, type RecordType } from "../../lib/firebase/db/types";

export interface RecordPatient {
  id: string;
  name: string;
  patientCode: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  patient?: RecordPatient | null; // when set, the patient is locked
}

const newSubmitId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function AddRecordModal({ open, onClose, patient }: Props) {
  const { user } = useAuth();
  const { patients } = usePatients();

  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState<RecordType>(RECORD_TYPES[0]);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [submitId, setSubmitId] = useState(newSubmitId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPatientId(patient?.id ?? "");
      setType(RECORD_TYPES[0]);
      setValue("");
      setNotes("");
      setSubmitId(newSubmitId()); // new ID per opening
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient?.id]);

  const selected: RecordPatient | null =
    patient ??
    (() => {
      const p = patients.find((x) => x.id === patientId);
      return p ? { id: p.id, name: p.name, patientCode: p.patientCode } : null;
    })();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    if (!user) return setError("You are not signed in.");
    if (!selected) return setError("Select a patient.");
    if (!value.trim()) return setError("Enter a value or finding.");

    setSaving(true);
    setError(null);
    try {
      await addRecord(user.uid, submitId, {
        patientId: selected.id,
        patientName: selected.name,
        patientCode: selected.patientCode,
        type,
        value,
        notes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add record" description="Log a health record for a patient">
      <form onSubmit={handleSubmit} className="space-y-4">
        {patient ? (
          <FormField label="Patient">
            <input className={inputClass} value={`${patient.name}${patient.patientCode ? ` · ${patient.patientCode}` : ""}`} disabled />
          </FormField>
        ) : (
          <FormField label="Patient">
            <select className={inputClass} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.patientCode ? ` · ${p.patientCode}` : ""}
                </option>
              ))}
            </select>
          </FormField>
        )}
        <FormField label="Record type">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as RecordType)}>
            {RECORD_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Value / finding">
          <input className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. BP 130/85, Hb 10.2" />
        </FormField>
        <FormField label="Notes">
          <textarea rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <FormFooter saving={saving} onCancel={onClose} submitLabel="Save record" />
      </form>
    </Modal>
  );
}