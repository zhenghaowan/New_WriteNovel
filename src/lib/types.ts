export type Genre =
  | "玄幻"
  | "仙侠"
  | "都市"
  | "历史"
  | "科幻"
  | "悬疑"
  | "言情"
  | "末日"
  | "游戏"
  | "其他";

export type NovelStatus = "构思中" | "连载中" | "已完结";

export interface StyleProfile {
  sampleText: string;
  analyzedAt?: string;
  traits: StyleTraits;
}

export interface StyleTraits {
  avgSentenceLength: number;
  dialogueRatio: number;
  adjectivesPerHundred: number;
  perspective: "第一人称" | "第三人称" | "混合" | "未知";
  toneTags: string[];
  vocabularyLevel: "白话直白" | "文艺细腻" | "网文爽快" | "古典文言感" | "混合";
  pacing: "快节奏推进" | "慢热铺陈" | "张弛有度";
  signaturePhrases: string[];
  summary: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  updatedAt: string;
  outline?: string;
}

export interface NovelProject {
  id: string;
  title: string;
  genre: Genre;
  synopsis: string;
  status: NovelStatus;
  targetWords: number;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  outline: string;
  trendBlend: number; // 0-100: how much to blend trending tropes
  selectedTropes: string[];
}

export interface TrendEntry {
  rank: number;
  title: string;
  author: string;
  platform: string;
  board: string;
  genre: Genre | string;
  tags: string[];
  heat: number;
  tropeSignals: string[];
  styleSignals: string[];
  officialSearchUrl: string;
}

export interface TrendSnapshot {
  fetchedAt: string;
  sourceNote: string;
  boards: { name: string; platform: string; entries: TrendEntry[] }[];
  hotGenres: { genre: string; share: number; rising: boolean }[];
  hotTropes: { trope: string; count: number; boards: string[] }[];
  styleInsights: string[];
}

export interface WriteRequest {
  projectId: string;
  chapterTitle: string;
  outline: string;
  previousContext?: string;
  style: StyleProfile;
  genre: Genre;
  selectedTropes: string[];
  trendBlend: number;
  targetWords: number;
}

export interface WriteResponse {
  content: string;
  mode: "live" | "demo";
  notes: string[];
}
