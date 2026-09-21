import { NextResponse } from "next/server";
import { buildStyleSketch } from "@/lib/style-sketch";
import type { TrendEntry } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<TrendEntry>;
  if (!body?.title || !body?.platform) {
    return NextResponse.json({ error: "缺少书目信息" }, { status: 400 });
  }

  const result = buildStyleSketch({
    title: body.title,
    genre: body.genre || "其他",
    tropeSignals: body.tropeSignals || [],
    styleSignals: body.styleSignals || [],
    platform: body.platform,
  });

  return NextResponse.json({
    ...result,
    title: body.title,
    author: body.author || "",
    platform: body.platform,
  });
}
