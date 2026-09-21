import type { StyleProfile, StyleTraits } from "./types";

function countMatches(text: string, re: RegExp): number {
  return (text.match(re) || []).length;
}

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?…]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function analyzeStyle(sampleText: string): StyleTraits {
  const cleaned = sampleText.trim();
  if (!cleaned.length) {
    return {
      avgSentenceLength: 0,
      dialogueRatio: 0,
      adjectivesPerHundred: 0,
      perspective: "未知",
      toneTags: [],
      vocabularyLevel: "混合",
      pacing: "张弛有度",
      signaturePhrases: [],
      summary: "请粘贴至少 200 字的个人文稿样本，系统才能提取你的写作指纹。",
    };
  }

  const sentences = splitSentences(cleaned);
  const chars = cleaned.replace(/\s/g, "").length;
  const avgSentenceLength =
    sentences.length > 0
      ? Math.round(sentences.reduce((a, s) => a + s.length, 0) / sentences.length)
      : chars;

  const dialogueMatches = cleaned.match(/[“"][^”"]*[”"]/g) || [];
  const dialogueChars = dialogueMatches.join("").length;
  const dialogueRatio = chars > 0 ? Math.min(1, dialogueChars / chars) : 0;

  const adjectiveLike = countMatches(
    cleaned,
    /忽然|居然|竟然|缓缓|轻轻|猛然|幽幽|淡淡|深深|静静|微微|隐隐|冷冷|狠狠|悄悄|徐徐|渐渐/g,
  );
  const adjectivesPerHundred = chars > 0 ? Math.round((adjectiveLike / chars) * 1000) / 10 : 0;

  const firstPerson = countMatches(cleaned, /我|我们|咱/g);
  const thirdPerson = countMatches(cleaned, /他|她|他们|她们|其/g);
  let perspective: StyleTraits["perspective"] = "未知";
  if (firstPerson > thirdPerson * 1.4) perspective = "第一人称";
  else if (thirdPerson > firstPerson * 1.4) perspective = "第三人称";
  else if (firstPerson + thirdPerson > 5) perspective = "混合";

  const toneTags: string[] = [];
  if (/笑|哈哈|嘲讽|嘴角/.test(cleaned)) toneTags.push("带点戏谑");
  if (/泪|痛|心酸|哽咽|悲/.test(cleaned)) toneTags.push("情感张力");
  if (/杀|剑|血|战|轰/.test(cleaned)) toneTags.push("冲突感强");
  if (/风|月|雨|雾|灯|夜色/.test(cleaned)) toneTags.push("意象偏好");
  if (/系统|面板|属性|升级/.test(cleaned)) toneTags.push("游戏化表达");
  if (toneTags.length === 0) toneTags.push("叙事平稳");

  let vocabularyLevel: StyleTraits["vocabularyLevel"] = "混合";
  const classical = countMatches(cleaned, /之|乎|者|矣|乃|遂|吾|尔|焉/g);
  const webFast = countMatches(cleaned, /瞬间|直接|当场|下一秒|果断|爆|拉满|起飞/g);
  const literary = countMatches(cleaned, /仿佛|宛如|如同|悄然|凝望|弥漫/g);
  if (classical > 8) vocabularyLevel = "古典文言感";
  else if (webFast > literary && webFast > 3) vocabularyLevel = "网文爽快";
  else if (literary > webFast && literary > 3) vocabularyLevel = "文艺细腻";
  else if (avgSentenceLength < 18) vocabularyLevel = "白话直白";

  let pacing: StyleTraits["pacing"] = "张弛有度";
  if (avgSentenceLength < 16 && dialogueRatio > 0.25) pacing = "快节奏推进";
  else if (avgSentenceLength > 28) pacing = "慢热铺陈";

  const phraseCandidates = [
    ...cleaned.matchAll(/(.{2,6})(?:。|，|！)/g),
  ]
    .map((m) => m[1])
    .filter((p) => p && !/^[的了着过在是有和与]/.test(p));
  const freq = new Map<string, number>();
  for (const p of phraseCandidates.slice(0, 80)) {
    freq.set(p, (freq.get(p) || 0) + 1);
  }
  const signaturePhrases = [...freq.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p]) => p);

  const summary = [
    `你的文风偏「${vocabularyLevel}」，视角多为「${perspective}」。`,
    `平均句长约 ${avgSentenceLength} 字，对白占比约 ${Math.round(dialogueRatio * 100)}%。`,
    `节奏倾向「${pacing}」，语气标签：${toneTags.join("、")}。`,
    signaturePhrases.length
      ? `反复出现的表达习惯：${signaturePhrases.join("、")}。`
      : "样本中尚未形成明显口头禅，可再补充更多正文。",
  ].join("");

  return {
    avgSentenceLength,
    dialogueRatio: Math.round(dialogueRatio * 100) / 100,
    adjectivesPerHundred,
    perspective,
    toneTags,
    vocabularyLevel,
    pacing,
    signaturePhrases,
    summary,
  };
}

export function emptyStyleProfile(): StyleProfile {
  return {
    sampleText: "",
    traits: analyzeStyle(""),
  };
}

export function buildStylePrompt(profile: StyleProfile): string {
  const t = profile.traits;
  return [
    `写作视角：${t.perspective}`,
    `词汇气质：${t.vocabularyLevel}`,
    `节奏：${t.pacing}`,
    `平均句长约 ${t.avgSentenceLength} 字`,
    `对白密度约 ${Math.round(t.dialogueRatio * 100)}%`,
    `语气：${t.toneTags.join("、") || "自然"}`,
    t.signaturePhrases.length
      ? `可适度呼应的表达习惯：${t.signaturePhrases.join("、")}`
      : "",
    "必须保持原创，不得抄袭任何已发表作品原文。",
    "优先贴合作者个人风格，热点套路仅作题材参考。",
  ]
    .filter(Boolean)
    .join("\n");
}
