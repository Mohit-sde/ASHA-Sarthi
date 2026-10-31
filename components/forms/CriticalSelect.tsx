"use client";

import { FormField, inputClass } from "../ui/Modal";
import { CRITICAL_LEVELS, CRITICAL_META, type CriticalLevel } from "../../lib/firebase/db/types";

export default function CriticalSelect({
  value,
  onChange,
}: {
  value: CriticalLevel;
  onChange: (v: CriticalLevel) => void;
}) {
  return (
    <FormField label="Critical condition level">
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as CriticalLevel)}>
        {CRITICAL_LEVELS.map((l) => (
          <option key={l} value={l}>
            {CRITICAL_META[l].label}
          </option>
        ))}
      </select>
    </FormField>
  );
}