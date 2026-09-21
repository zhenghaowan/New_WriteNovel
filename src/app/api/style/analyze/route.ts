import { NextResponse } from "next/server";
import { analyzeStyle } from "@/lib/style-analyzer";

export async function POST(request: Request) {
  const body = (await request.json()) as { sampleText?: string };
  const sampleText = body.sampleText || "";
  const traits = analyzeStyle(sampleText);
  return NextResponse.json({
    sampleText,
    analyzedAt: new Date().toISOString(),
    traits,
  });
}
