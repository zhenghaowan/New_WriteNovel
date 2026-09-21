import type { Genre, NovelProject, StyleProfile, Chapter } from "./types";
import { emptyStyleProfile } from "./style-analyzer";

const PROJECTS_KEY = "inkpress.projects.v1";
const STYLE_KEY = "inkpress.style.v1";
const ACTIVE_KEY = "inkpress.active.v1";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function wordCount(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function createChapter(partial?: Partial<Chapter>): Chapter {
  const content = partial?.content || "";
  return {
    id: partial?.id || uid(),
    title: partial?.title || "新章节",
    content,
    wordCount: wordCount(content),
    updatedAt: new Date().toISOString(),
    outline: partial?.outline || "",
  };
}

export function createProject(input?: {
  title?: string;
  genre?: Genre;
  synopsis?: string;
}): NovelProject {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: input?.title || "未命名小说",
    genre: input?.genre || "玄幻",
    synopsis: input?.synopsis || "",
    status: "构思中",
    targetWords: 200000,
    createdAt: now,
    updatedAt: now,
    chapters: [
      createChapter({
        title: "第一章",
        outline: "开场建立人物与冲突",
      }),
    ],
    outline: "",
    trendBlend: 35,
    selectedTropes: [],
  };
}

export function loadProjects(): NovelProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NovelProject[];
  } catch {
    return [];
  }
}

export function saveProjects(projects: NovelProject[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadStyle(): StyleProfile {
  if (typeof window === "undefined") return emptyStyleProfile();
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (!raw) return emptyStyleProfile();
    return JSON.parse(raw) as StyleProfile;
  } catch {
    return emptyStyleProfile();
  }
}

export function saveStyle(style: StyleProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STYLE_KEY, JSON.stringify(style));
}

export function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (!id) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}

export const GENRES: Genre[] = [
  "玄幻",
  "仙侠",
  "都市",
  "历史",
  "科幻",
  "悬疑",
  "言情",
  "末日",
  "游戏",
  "其他",
];
