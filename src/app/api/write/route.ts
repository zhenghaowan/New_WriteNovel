import { NextResponse } from "next/server";
import { generateChapter } from "@/lib/mock-writer";
import type { WriteRequest } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as WriteRequest;
  if (!body?.style) {
    return NextResponse.json({ error: "缺少文风配置" }, { status: 400 });
  }
  const result = await generateChapter({
    ...body,
    targetWords: body.targetWords || 800,
    selectedTropes: body.selectedTropes || [],
    trendBlend: body.trendBlend ?? 35,
    genre: body.genre || "其他",
    chapterTitle: body.chapterTitle || "未命名章节",
    outline: body.outline || "",
  });
  return NextResponse.json(result);
}
