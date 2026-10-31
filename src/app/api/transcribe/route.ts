import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const audio = await req.arrayBuffer();
  const contentType = req.headers.get("content-type") || "audio/webm";

  const params = new URLSearchParams({
    model: "nova-3",
    language: "multi",
    diarize: "true",
    paragraphs: "true",
    smart_format: "true",
  });

  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": contentType,
    },
    body: audio,
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }

  const data = await res.json();
  const paragraphs =
    data.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs ?? [];

  const turns = paragraphs.map((p: any) => ({
    speaker: `Speaker ${p.speaker}`,
    text: p.sentences.map((s: any) => s.text).join(" "),
  }));

  return NextResponse.json({ turns });
}