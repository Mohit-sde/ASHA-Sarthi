"use client";

import { useEffect, useState } from "react";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";

type Phase = "idle" | "recording" | "processing" | "review";

interface Turn {
  speaker: string;
  text: string;
}

interface Extraction {
  turns: Turn[];
  report: string;
}

interface QueuedRecord extends Extraction {
  id: string;
  createdAt: string;
}

const QUEUE_KEY = "asha-sarthi-queue";

function loadQueue(): QueuedRecord[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRecord[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRecord[]) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or blocked; the in-memory queue still works for this session.
  }
}

function formatElapsed(total: number) {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const MicIcon = () => (
  <svg viewBox="0 0 24 24" className="h-10 w-10 fill-white" aria-hidden>
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
  </svg>
);

const STEPS = [
  "Tap the big green button to start.",
  "Talk with the patient or family as you normally would.",
  "Tap the red button when you are done.",
];

export default function AshaSarthiConsole() {
  const { start, stop } = useAudioRecorder();

  const [phase, setPhase] = useState<Phase>("idle");
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQueue(loadQueue());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveQueue(queue);
  }, [queue, hydrated]);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function startRecording() {
    setError(null);
    try {
      await start();
      setElapsed(0);
      setPhase("recording");
    } catch {
      setToast("Microphone permission is needed to record.");
    }
  }

  async function finishRecording() {
    setPhase("processing");
    try {
      const blob = await stop();

      const tRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob,
      });
      if (!tRes.ok) throw new Error("transcribe failed");
      const { turns } = await tRes.json();

      const rRes = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turns }),
      });
      if (!rRes.ok) throw new Error("report failed");
      const { report } = await rRes.json();

      setExtraction({ turns, report });
      setPhase("review");
    } catch {
      setError("Something went wrong with that recording. Please try again.");
      setPhase("idle");
    }
  }

  function submit() {
    if (!extraction) return;
    if (online) {
      setToast("Saved to the health registry.");
    } else {
      const record: QueuedRecord = {
        ...extraction,
        id: `REC-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setQueue((q) => [...q, record]);
      setToast("Saved on this phone. It will upload when you are back online.");
    }
    setExtraction(null);
    setPhase("idle");
  }

  function discard() {
    setExtraction(null);
    setPhase("idle");
  }

  function syncNow() {
    if (!online || queue.length === 0 || syncing) return;
    const count = queue.length;
    setSyncing(true);
    window.setTimeout(() => {
      setQueue([]);
      setSyncing(false);
      setToast(`${count} saved visit${count > 1 ? "s" : ""} uploaded.`);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-base font-bold text-white shadow-sm">
              AS
            </div>
            <div>
              <p className="text-sm text-gray-500">ASHA-Sarthi</p>
              <h1 className="text-lg font-bold text-gray-900">Visit Recorder</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnline((o) => !o)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                online ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`} />
              {online ? "Online" : "Offline"}
            </button>

            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200">
              Saved
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-600 px-2 text-xs font-semibold text-white">
                {queue.length}
              </span>
            </div>

            {online && (
              <button
                type="button"
                onClick={syncNow}
                disabled={syncing || queue.length === 0}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {syncing ? "Uploading…" : "Upload saved"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
        {/* Idle */}
        {phase === "idle" && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">Record a visit</h2>
            <p className="mt-1 text-gray-500">Three simple steps:</p>
            <ol className="mt-6 space-y-4">
              {STEPS.map((step, i) => (
                <li key={i} className="flex items-center gap-4 rounded-2xl bg-indigo-50/60 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-lg text-gray-800">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-gray-500">Hindi, Punjabi and English can be mixed.</p>
            {error && (
              <p className="mt-4 rounded-xl bg-rose-50 p-3 text-base text-rose-700">{error}</p>
            )}
          </section>
        )}

        {/* Recording */}
        {phase === "recording" && (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 sm:p-12">
            <p className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
              Recording
            </p>
            <p className="mt-6 text-7xl font-bold tabular-nums text-gray-900 sm:text-8xl">
              {formatElapsed(elapsed)}
            </p>
            <p className="mt-4 text-lg text-gray-500">Speak normally. Tap the red button when finished.</p>
          </section>
        )}

        {/* Processing */}
        {phase === "processing" && (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-[6px] border-indigo-100 border-t-indigo-600" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Preparing your report</h2>
            <p className="mt-2 text-lg text-gray-500">This usually takes a few seconds.</p>
          </section>
        )}

        {/* Review */}
        {phase === "review" && extraction && (
          <>
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-xl font-bold text-gray-900">What was said</h2>
              <div className="mt-4 space-y-3">
                {extraction.turns.map((t, i) => (
                  <div key={i} className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-indigo-600">{t.speaker}</p>
                    <p className="mt-1 text-lg leading-relaxed text-gray-800">{t.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Visit report</h2>
              <pre className="mt-4 whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-800">
                {extraction.report}
              </pre>
            </section>

            <button
              type="button"
              onClick={discard}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 active:scale-95"
            >
              Start over
            </button>
          </>
        )}
      </main>

      {/* Bottom action area */}
<div className="sticky bottom-0 z-30 border-t border-gray-100 bg-white/95 px-4 py-5 backdrop-blur">
  <div className="mx-auto flex max-w-3xl justify-center">
    {phase === "idle" && (
      <button
        type="button"
        onClick={startRecording}
        aria-label="Start recording"
        className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full bg-emerald-600 shadow-lg ring-8 ring-emerald-100 transition active:scale-95 sm:h-32 sm:w-32"
      >
        <MicIcon />
        <span className="text-sm font-semibold text-white">Start</span>
      </button>
    )}

    {phase === "recording" && (
      <button
        type="button"
        onClick={finishRecording}
        aria-label="Stop recording"
        className="flex h-28 w-28 animate-pulse flex-col items-center justify-center gap-1 rounded-full bg-rose-600 shadow-lg ring-8 ring-rose-100 transition active:scale-95 sm:h-32 sm:w-32"
      >
        <span className="h-9 w-9 rounded-md bg-white" />
        <span className="text-sm font-semibold text-white">Stop</span>
      </button>
    )}

    {phase === "review" && (
      <button
        type="button"
        onClick={submit}
        className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99]"
      >
        {online ? "Save visit to registry" : "Save on this phone"}
      </button>
    )}

    {phase === "processing" && <p className="py-6 text-base text-gray-500">Please wait…</p>}
  </div>
</div>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-24 z-40 w-[90%] max-w-md -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-4 text-center text-base font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}