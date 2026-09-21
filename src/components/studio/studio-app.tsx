"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  NovelProject,
  StyleProfile,
  TrendEntry,
  TrendSnapshot,
  WriteResponse,
  Genre,
} from "@/lib/types";
import {
  GENRES,
  createChapter,
  createProject,
  loadActiveId,
  loadProjects,
  loadStyle,
  saveActiveId,
  saveProjects,
  saveStyle,
  wordCount,
} from "@/lib/storage";
import { analyzeStyle, emptyStyleProfile } from "@/lib/style-analyzer";
import { openOfficialReader } from "@/lib/desktop";

type Panel = "write" | "style" | "trends";

export function StudioApp() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<NovelProject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleProfile>(() => emptyStyleProfile());
  const [panel, setPanel] = useState<Panel>("write");
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [trends, setTrends] = useState<TrendSnapshot | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [writeNotes, setWriteNotes] = useState<string[]>([]);
  const [writeMode, setWriteMode] = useState<"live" | "demo" | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<TrendEntry | null>(null);
  const [previewSketch, setPreviewSketch] = useState("");
  const [previewDisclaimer, setPreviewDisclaimer] = useState("");
  const [previewOfficialUrl, setPreviewOfficialUrl] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const loaded = loadProjects();
    const styleLoaded = loadStyle();
    let active = loadActiveId();
    if (loaded.length === 0) {
      const demo = createProject({
        title: "潮汐守夜人",
        genre: "科幻",
        synopsis: "沿海观测站在潮汐异常之夜发现了不该存在的航线。",
      });
      demo.chapters[0].title = "潮声之前";
      demo.chapters[0].outline = "主角接到异常观测报告，决定违令出海确认。";
      demo.status = "连载中";
      saveProjects([demo]);
      saveActiveId(demo.id);
      setProjects([demo]);
      setActiveId(demo.id);
      setChapterId(demo.chapters[0].id);
    } else {
      if (!active || !loaded.find((p) => p.id === active)) active = loaded[0].id;
      setProjects(loaded);
      setActiveId(active);
      const proj = loaded.find((p) => p.id === active) || loaded[0];
      setChapterId(proj.chapters[0]?.id || null);
      saveActiveId(active);
    }
    setStyle(
      styleLoaded.sampleText
        ? styleLoaded
        : {
            sampleText: "",
            traits: analyzeStyle(""),
          },
    );
    const panelParam = searchParams.get("panel");
    if (panelParam === "style" || panelParam === "trends" || panelParam === "write") {
      setPanel(panelParam);
    }
    setReady(true);
  }, [searchParams]);

  const active = useMemo(
    () => projects.find((p) => p.id === activeId) || null,
    [projects, activeId],
  );
  const chapter = useMemo(
    () => active?.chapters.find((c) => c.id === chapterId) || active?.chapters[0] || null,
    [active, chapterId],
  );

  const totalWords = useMemo(
    () => (active ? active.chapters.reduce((s, c) => s + c.wordCount, 0) : 0),
    [active],
  );

  function persist(next: NovelProject[]) {
    setProjects(next);
    saveProjects(next);
  }

  function updateActive(mutator: (p: NovelProject) => NovelProject) {
    if (!active) return;
    const next = projects.map((p) =>
      p.id === active.id ? { ...mutator(p), updatedAt: new Date().toISOString() } : p,
    );
    persist(next);
  }

  function updateChapter(mutator: (c: NonNullable<typeof chapter>) => NonNullable<typeof chapter>) {
    if (!active || !chapter) return;
    updateActive((p) => ({
      ...p,
      chapters: p.chapters.map((c) => {
        if (c.id !== chapter.id) return c;
        const updated = mutator(c);
        return {
          ...updated,
          wordCount: wordCount(updated.content),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }

  async function refreshTrends() {
    setTrendLoading(true);
    setStatusMsg("正在刷新各站榜单题材信号…");
    try {
      const res = await fetch("/api/trends", { cache: "no-store" });
      const data = (await res.json()) as TrendSnapshot;
      setTrends(data);
      setStatusMsg(`已更新 ${data.boards.length} 个榜单 · 每榜前 100`);
    } catch {
      setStatusMsg("趋势刷新失败，请稍后重试");
    } finally {
      setTrendLoading(false);
    }
  }

  useEffect(() => {
    if (ready && panel === "trends" && !trends) {
      void refreshTrends();
    }
  }, [ready, panel, trends]);

  async function analyzeUserStyle() {
    const traits = analyzeStyle(style.sampleText);
    const next: StyleProfile = {
      sampleText: style.sampleText,
      analyzedAt: new Date().toISOString(),
      traits,
    };
    setStyle(next);
    saveStyle(next);
    setStatusMsg("文风指纹已更新");
  }

  async function openStylePreview(entry: TrendEntry) {
    setPreviewEntry(entry);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewSketch("");
    setPreviewDisclaimer("");
    setPreviewOfficialUrl(entry.officialSearchUrl);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const data = (await res.json()) as {
        sketch?: string;
        disclaimer?: string;
        officialSearchUrl?: string;
      };
      setPreviewSketch(data.sketch || "");
      setPreviewDisclaimer(data.disclaimer || "");
      setPreviewOfficialUrl(data.officialSearchUrl || entry.officialSearchUrl);
    } catch {
      setPreviewSketch("预览生成失败，请稍后重试。");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function aiWrite() {
    if (!active || !chapter) return;
    setWriting(true);
    setWriteNotes([]);
    setStatusMsg("正在按你的文风起草本章…");
    try {
      const prev = active.chapters
        .filter((c) => c.id !== chapter.id && c.content)
        .slice(-1)[0]?.content.slice(-400);
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: active.id,
          chapterTitle: chapter.title,
          outline: chapter.outline || active.outline,
          previousContext: prev,
          style,
          genre: active.genre,
          selectedTropes: active.selectedTropes,
          trendBlend: active.trendBlend,
          targetWords: 900,
        }),
      });
      const data = (await res.json()) as WriteResponse;
      updateChapter((c) => ({
        ...c,
        content: c.content.trim()
          ? `${c.content.trim()}\n\n${data.content}`
          : data.content,
      }));
      setWriteNotes(data.notes);
      setWriteMode(data.mode);
      setStatusMsg(data.mode === "live" ? "在线模型已生成草稿" : "演示引擎已生成草稿");
    } catch {
      setStatusMsg("生成失败，请重试");
    } finally {
      setWriting(false);
    }
  }

  function addProject() {
    const p = createProject({ title: "新书草稿", genre: "都市" });
    const next = [p, ...projects];
    persist(next);
    setActiveId(p.id);
    saveActiveId(p.id);
    setChapterId(p.chapters[0].id);
    setPanel("write");
  }

  function addChapter() {
    if (!active) return;
    const c = createChapter({
      title: `第${active.chapters.length + 1}章`,
      outline: "",
    });
    updateActive((p) => ({ ...p, chapters: [...p.chapters, c] }));
    setChapterId(c.id);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        正在打开墨压工作室…
      </div>
    );
  }

  return (
    <div className="studio-shell min-h-screen">
      <header className="studio-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="brand-mark">
              墨压
            </Link>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <nav className="flex gap-1">
              {(
                [
                  ["write", "写作台"],
                  ["style", "文风指纹"],
                  ["trends", "榜单雷达"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`nav-chip ${panel === id ? "nav-chip-active" : ""}`}
                  onClick={() => setPanel(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {statusMsg ? (
              <span className="hidden max-w-[220px] truncate text-xs text-muted-foreground md:inline">
                {statusMsg}
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={addProject}>
              新建小说
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="studio-aside">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
              我的书稿
            </h2>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          <ScrollArea className="h-[calc(100vh-9rem)] pr-2">
            <div className="space-y-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`project-item ${p.id === activeId ? "project-item-active" : ""}`}
                  onClick={() => {
                    startTransition(() => {
                      setActiveId(p.id);
                      saveActiveId(p.id);
                      setChapterId(p.chapters[0]?.id || null);
                      setPanel("write");
                    });
                  }}
                >
                  <div className="truncate font-medium">{p.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{p.genre}</span>
                    <span>·</span>
                    <span>{p.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <section className="min-w-0">
          {panel === "write" && active && chapter ? (
            <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="chapter-rail">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">章节</span>
                  <Button variant="ghost" size="sm" onClick={addChapter}>
                    +
                  </Button>
                </div>
                <div className="space-y-1">
                  {active.chapters.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`chapter-item ${c.id === chapter.id ? "chapter-item-active" : ""}`}
                      onClick={() => setChapterId(c.id)}
                    >
                      <div className="truncate text-sm">{c.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.wordCount} 字
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="meta-bar">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label htmlFor="title">书名</Label>
                      <Input
                        id="title"
                        value={active.title}
                        onChange={(e) =>
                          updateActive((p) => ({ ...p, title: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="genre">题材</Label>
                      <select
                        id="genre"
                        className="native-select"
                        value={active.genre}
                        onChange={(e) =>
                          updateActive((p) => ({
                            ...p,
                            genre: e.target.value as Genre,
                          }))
                        }
                      >
                        {GENRES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status">状态</Label>
                      <select
                        id="status"
                        className="native-select"
                        value={active.status}
                        onChange={(e) =>
                          updateActive((p) => ({
                            ...p,
                            status: e.target.value as NovelProject["status"],
                          }))
                        }
                      >
                        {(["构思中", "连载中", "已完结"] as const).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>热点融合 {active.trendBlend}%</Label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={active.trendBlend}
                        className="mt-3 w-full accent-[var(--ink-accent)]"
                        onChange={(e) =>
                          updateActive((p) => ({
                            ...p,
                            trendBlend: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>全书进度</span>
                      <span>
                        {totalWords.toLocaleString()} / {active.targetWords.toLocaleString()} 字
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, (totalWords / active.targetWords) * 100)}
                    />
                  </div>
                </div>

                <div className="editor-panel">
                  <div className="mb-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ch-title">章节标题</Label>
                      <Input
                        id="ch-title"
                        value={chapter.title}
                        onChange={(e) =>
                          updateChapter((c) => ({ ...c, title: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ch-outline">本章提纲</Label>
                      <Input
                        id="ch-outline"
                        value={chapter.outline || ""}
                        placeholder="这一章要发生什么？"
                        onChange={(e) =>
                          updateChapter((c) => ({ ...c, outline: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <Textarea
                    className="editor-textarea min-h-[420px]"
                    value={chapter.content}
                    placeholder="在这里写正文，或让 AI 按你的文风起草…"
                    onChange={(e) =>
                      updateChapter((c) => ({ ...c, content: e.target.value }))
                    }
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button onClick={aiWrite} disabled={writing}>
                      {writing ? "起草中…" : "AI 按我的风格续写"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPanel("style");
                      }}
                    >
                      调整文风
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPanel("trends");
                        if (!trends) void refreshTrends();
                      }}
                    >
                      参考热榜套路
                    </Button>
                    {writeMode ? (
                      <Badge variant={writeMode === "live" ? "default" : "secondary"}>
                        {writeMode === "live" ? "在线模型" : "演示引擎"}
                      </Badge>
                    ) : null}
                    <span className="ml-auto text-xs text-muted-foreground">
                      本章 {chapter.wordCount} 字 · 自动保存在本机浏览器
                    </span>
                  </div>
                  {writeNotes.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {writeNotes.map((n) => (
                        <li key={n}>· {n}</li>
                      ))}
                    </ul>
                  ) : null}
                  {active.selectedTropes.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {active.selectedTropes.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() =>
                            updateActive((p) => ({
                              ...p,
                              selectedTropes: p.selectedTropes.filter((x) => x !== t),
                            }))
                          }
                        >
                          {t} ×
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {panel === "style" ? (
            <div className="editor-panel space-y-4">
              <div>
                <h2 className="font-display text-2xl tracking-tight">文风指纹</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  粘贴你自己写过的段落（建议 500 字以上）。系统只学习语气与节奏，写作时会优先贴合你，而不是模仿榜单原作。
                </p>
              </div>
              <Textarea
                className="min-h-[260px] font-serif leading-8"
                value={style.sampleText}
                placeholder="把你的小说片段、随笔或旧稿贴在这里…"
                onChange={(e) =>
                  setStyle((s) => ({ ...s, sampleText: e.target.value }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={analyzeUserStyle}>分析我的风格</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const sample = `雨停之后，码头上只剩下一盏还没熄的灯。我把衣领竖起来，听见潮水一下一下拍着木桩，像有人在远处数着什么。
「你还要等吗？」身后有人问。
「再等一潮。」我说。其实我也说不清在等什么，只是觉得今晚若是空手回去，以后提到这件事，会后悔。
灯火在水面上碎成细片。我想起三年前第一次出海，也是这样的夜，只是那时身边还有另一个人。`;
                    setStyle((s) => ({ ...s, sampleText: sample }));
                  }}
                >
                  填入示例样本
                </Button>
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Stat label="平均句长" value={`${style.traits.avgSentenceLength} 字`} />
                <Stat
                  label="对白占比"
                  value={`${Math.round(style.traits.dialogueRatio * 100)}%`}
                />
                <Stat label="视角" value={style.traits.perspective} />
                <Stat label="词汇气质" value={style.traits.vocabularyLevel} />
                <Stat label="节奏" value={style.traits.pacing} />
                <Stat
                  label="语气"
                  value={style.traits.toneTags.join("、") || "—"}
                />
              </div>
              <p className="rounded-lg bg-[var(--ink-wash)] p-4 text-sm leading-7">
                {style.traits.summary}
              </p>
              {style.analyzedAt ? (
                <p className="text-xs text-muted-foreground">
                  最近分析：{new Date(style.analyzedAt).toLocaleString("zh-CN")}
                </p>
              ) : null}
            </div>
          ) : null}

          {panel === "trends" ? (
            <div className="space-y-4">
              <div className="editor-panel">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl tracking-tight">榜单雷达</h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      汇总主流小说站各榜前 100 的题材与套路信号。可点「风格速写」感受写法气质；
                      点「官方站阅读」会打开正版网站页面供你在站内阅读正文（不下载、不内嵌章节）。
                    </p>
                  </div>
                  <Button onClick={refreshTrends} disabled={trendLoading}>
                    {trendLoading ? "刷新中…" : "立即刷新"}
                  </Button>
                </div>
                {trends ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    更新于 {new Date(trends.fetchedAt).toLocaleString("zh-CN")} ·{" "}
                    {trends.sourceNote}
                  </p>
                ) : null}
              </div>

              {trends ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="editor-panel">
                      <h3 className="mb-3 text-sm font-medium">热门题材占比</h3>
                      <div className="space-y-3">
                        {trends.hotGenres.slice(0, 6).map((g) => (
                          <div key={g.genre}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>
                                {g.genre}
                                {g.rising ? (
                                  <Badge className="ml-2" variant="secondary">
                                    上升
                                  </Badge>
                                ) : null}
                              </span>
                              <span className="text-muted-foreground">{g.share}%</span>
                            </div>
                            <Progress value={g.share} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="editor-panel">
                      <h3 className="mb-3 text-sm font-medium">高频套路信号</h3>
                      <div className="flex flex-wrap gap-2">
                        {trends.hotTropes.map((t) => (
                          <button
                            key={t.trope}
                            type="button"
                            className="trope-chip"
                            onClick={() => {
                              if (!active) return;
                              if (active.selectedTropes.includes(t.trope)) return;
                              updateActive((p) => ({
                                ...p,
                                selectedTropes: [...p.selectedTropes, t.trope].slice(0, 6),
                              }));
                              setStatusMsg(`已加入写作参考：${t.trope}`);
                              setPanel("write");
                            }}
                          >
                            <span>{t.trope}</span>
                            <span className="text-muted-foreground">{t.count}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        点击套路可加入当前书稿的「热点参考」，写作时按融合度使用。
                      </p>
                    </div>
                  </div>

                  <div className="editor-panel">
                    <h3 className="mb-3 text-sm font-medium">叙事风格洞察</h3>
                    <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                      {trends.styleInsights.map((s) => (
                        <li key={s}>· {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="editor-panel">
                    <Tabs defaultValue={`${trends.boards[0]?.platform}-${trends.boards[0]?.name}`}>
                      <TabsList className="mb-3 flex h-auto flex-wrap gap-1">
                        {trends.boards.slice(0, 8).map((b) => (
                          <TabsTrigger
                            key={`${b.platform}-${b.name}`}
                            value={`${b.platform}-${b.name}`}
                          >
                            {b.platform}·{b.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {trends.boards.slice(0, 8).map((b) => (
                        <TabsContent
                          key={`${b.platform}-${b.name}`}
                          value={`${b.platform}-${b.name}`}
                        >
                          <ScrollArea className="h-[360px]">
                            <table className="w-full text-left text-sm">
                              <thead className="sticky top-0 bg-[var(--panel)] text-xs text-muted-foreground">
                                <tr>
                                  <th className="py-2 pr-2">#</th>
                                  <th className="py-2 pr-2">书名</th>
                                  <th className="py-2 pr-2">题材</th>
                                  <th className="py-2 pr-2">信号</th>
                                  <th className="py-2 pr-2">热度</th>
                                  <th className="py-2">阅读</th>
                                </tr>
                              </thead>
                              <tbody>
                                {b.entries.slice(0, 100).map((e) => (
                                  <tr key={`${e.rank}-${e.title}`} className="border-t border-border/60">
                                    <td className="py-2 pr-2 tabular-nums text-muted-foreground">
                                      {e.rank}
                                    </td>
                                    <td className="py-2 pr-2">
                                      <div className="font-medium">{e.title}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {e.author}
                                      </div>
                                    </td>
                                    <td className="py-2 pr-2">{e.genre}</td>
                                    <td className="py-2 pr-2">
                                      <div className="flex flex-wrap gap-1">
                                        {e.tropeSignals.map((t) => (
                                          <Badge key={t} variant="outline">
                                            {t}
                                          </Badge>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="py-2 pr-2 tabular-nums text-muted-foreground">
                                      {e.heat.toLocaleString()}
                                    </td>
                                    <td className="py-2">
                                      <div className="flex flex-col gap-1">
                                        <Button
                                          size="xs"
                                          variant="secondary"
                                          onClick={() => void openStylePreview(e)}
                                        >
                                          风格速写
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          onClick={() => void openOfficialReader(e.officialSearchUrl)}
                                        >
                                          官方站阅读
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </ScrollArea>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </>
              ) : (
                <div className="editor-panel text-sm text-muted-foreground">
                  {trendLoading ? "正在拉取榜单信号…" : "点击刷新以加载榜单雷达。"}
                </div>
              )}
            </div>
          ) : null}

          {panel === "write" && !active ? (
            <div className="editor-panel">
              <p className="text-muted-foreground">还没有书稿，点击右上角新建一本。
              </p>
            </div>
          ) : null}
        </section>
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {previewEntry ? `${previewEntry.title} · 风格速写` : "风格速写"}
            </DialogTitle>
            <DialogDescription>
              {previewDisclaimer ||
                "原创演示段落，用于粗略感受题材写法，不是榜上原作正文。"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto rounded-lg bg-[var(--ink-wash)] p-4 font-serif text-sm leading-8 whitespace-pre-wrap">
            {previewLoading ? "正在生成风格速写…" : previewSketch}
          </div>
          <div className="flex flex-wrap gap-2">
            {previewOfficialUrl ? (
              <Button
                onClick={() => void openOfficialReader(previewOfficialUrl)}
              >
                在官方站阅读正文
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-[var(--ink-wash)] px-3 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
