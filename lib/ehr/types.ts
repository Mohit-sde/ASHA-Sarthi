export const DIALECTS = [
  { value: "hi-IN", label: "Hindi" },
  { value: "pa-IN", label: "Punjabi" },
  { value: "bn-IN", label: "Bengali" },
  { value: "mr-IN", label: "Marathi" },
  { value: "ta-IN", label: "Tamil" },
  { value: "te-IN", label: "Telugu" },
  { value: "od-IN", label: "Odia" },
] as const;

export type DialectCode = (typeof DIALECTS)[number]["value"];

export type Section = "Patient" | "Vitals" | "Clinical" | "Plan";

export interface EhrField {
  key: string;
  label: string;
  value: string;
  confidence: "high" | "medium" | "low";
  section: Section;
}

export interface Concept {
  spoken: string;
  standard: string;
  snomed: string; // empty string when not confidently mapped
}

export interface EhrDraft {
  transcript: string;
  fields: EhrField[];
  concepts: Concept[];
  warnings: string[];
}