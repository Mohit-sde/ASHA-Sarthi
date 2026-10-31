import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Turn {
  speaker: string;
  text: string;
}

const MODEL = "gemini-3.8-flash"; // check Google AI Studio for the current free-tier model name

const SYSTEM_PROMPT = `You write visit reports from transcripts of conversations between a community health worker (ASHA worker) and a patient or family member.

The transcript may mix English, Hindi and Punjabi. Write the report in English, keeping local terms in brackets where useful.

Speakers are labeled by number ("Speaker 0", "Speaker 1"). Infer from the content which speaker is the community health worker and which is the patient or family member, and state your inference at the top of the report.

Use these headings: Patient details, Complaints, Vitals mentioned, Assessment, Advice given, Follow-up.

Include only what was said. Write "Not mentioned" for any section with no information, and flag any numbers that are unclear rather than guessing.`;

export async function generateVisitReport(turns: Turn[]): Promise<string> {
  const transcript = turns.map((t) => `${t.speaker}: ${t.text}`).join("\n");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: transcript,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 1500,
    },
  });

  return response.text ?? "";
}