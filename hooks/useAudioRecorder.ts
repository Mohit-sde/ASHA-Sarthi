"use client";
import { useRef, useState } from "react";

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }

  // Resolves with the recorded audio blob once the recorder has stopped.
  function stop(): Promise<Blob> {
    return new Promise((resolve) => {
      const rec = recRef.current!;
      rec.onstop = () => {
        rec.stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(chunks.current, { type: rec.mimeType }));
      };
      rec.stop();
      setRecording(false);
    });
  }

  return { recording, start, stop };
}