import { NextResponse } from "next/server";
import { generateVisitReport } from "../../../../lib/ai/report";

export async function POST(req: Request) {
  try {
    const { turns } = await req.json();

    if (!Array.isArray(turns) || turns.length === 0) {
      return NextResponse.json({ error: "No conversation to report on" }, { status: 400 });
    }

    const report = await generateVisitReport(turns);
    return NextResponse.json({ report });
  } catch (err: any) {
    console.error("[/api/report] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Report generation failed" },
      { status: 500 }
    );
  }
}