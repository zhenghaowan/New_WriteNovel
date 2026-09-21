import { NextResponse } from "next/server";
import { buildTrendSnapshot } from "@/lib/trends-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = buildTrendSnapshot(new Date());
  return NextResponse.json(snapshot);
}
