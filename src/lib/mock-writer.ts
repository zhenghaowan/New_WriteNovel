import type { StyleProfile, WriteRequest, WriteResponse } from "./types";
import { buildStylePrompt } from "./style-analyzer";

function clampWords(target: number): number {
  return Math.min(1800, Math.max(400, target || 800));
}

function paragraph(lines: string[]): string {
  return lines.filter(Boolean).join("");
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length) % arr.length];
}

function shuffle<T>(rand: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateDemoChapter(req: WriteRequest): WriteResponse {
  const words = clampWords(req.targetWords);
  const style = req.style;
  const tropes =
    req.selectedTropes.length > 0
      ? req.selectedTropes.slice(0, 3)
      : ["人物抉择", "局势反转"];
  const blend = Math.max(0, Math.min(100, req.trendBlend));
  const seed =
    Date.now() ^
    (req.chapterTitle || "").length * 997 ^
    (req.outline || "").length * 131 ^
    Math.floor(Math.random() * 1e9);
  const rand = mulberry32(seed);

  const notes: string[] = [
    "当前为本地演示引擎：未配置 OPENAI_API_KEY 时自动启用。",
    `热点融合度 ${blend}%：套路仅作情节推力，叙述口吻贴合你的风格样本。`,
    "输出为原创续写草稿，请人工修订后使用。",
  ];

  const voice = style.traits.vocabularyLevel;
  const perspective = style.traits.perspective;
  const whoPool =
    perspective === "第一人称"
      ? ["我"]
      : perspective === "第三人称"
        ? ["他", "她"]
        : ["林澈", "沈渡", "顾晚"];
  const who = pick(rand, whoPool);

  const openings: Record<string, string[]> = {
    网文爽快: [
      `${who}几乎是在下一秒就做出了决定。`,
      `局势已经摆明了，${who}没有再给自己留退路。`,
      `${who}把犹豫掐灭，动作比思考更快。`,
    ],
    文艺细腻: [
      `夜色像一层未干的墨，慢慢洇进窗棂。${who}站在那里，听见远处潮声一次次拍上石阶。`,
      `灯火在水面上碎开。${who}忽然觉得，有些决定会在多年后仍带着今晚的潮味。`,
      `${who}把袖口的湿意擦掉，目光却停在更远处那条不该存在的航线上。`,
    ],
    古典文言感: [
      `灯影摇曳，案上残卷未收。${who}抬眼，只觉风起于青萍之末。`,
      `更鼓未歇，${who}已自廊下起身，衣袂掠过未冷的茶盏。`,
      `${who}执卷良久，终于合上——有些事，纸上写不清。`,
    ],
    白话直白: [
      `${who}把茶凉了的那一口咽下去，才把眼前的事重新理清。`,
      `${who}在门口站了两秒，还是推门走了进去。`,
      `事情比预想麻烦。${who}先把能确认的部分列出来。`,
    ],
    混合: [
      `${who}没有立刻开口，先把呼吸放稳。`,
      `这一夜本来不该有故事，可${who}还是听见了那声异常的回响。`,
      `${who}抬起头时，远处的灯正好灭了一盏。`,
    ],
  };

  const opening = pick(rand, openings[voice] || openings["混合"]);

  const tropeBeat =
    blend > 40
      ? pick(rand, [
          `这一次的变故，隐约带着最近榜单上常见的「${tropes[0]}」味道——不是照搬桥段，而是把压力推到人物必须表态的位置。`,
          `若硬要说和热榜有什么相似，大概是「${tropes[0]}」那种把人逼到角落的节奏；可${who}的反应，仍是自己的。`,
          `外面的人爱谈「${tropes[0]}」，${who}只关心眼下这一步会不会踏空。`,
        ])
      : pick(rand, [
          `外界的热闹与${who}无关。真正难的是，把已经说出口的话收回去，已经不可能。`,
          `${who}刻意把热度挡在门外：故事要往前走，靠的是人物，不是风向。`,
          `没有人提醒${who}该怎么写这一夜，于是${who}只能按自己的方式走。`,
        ]);

  const dialogueHeavy = style.traits.dialogueRatio > 0.22;
  const mid = dialogueHeavy
    ? pick(rand, [
        paragraph([
          `「你确定要这么做？」对面的人声音很轻。`,
          `「不确定。」${who}说，「但停在这里更糟。」`,
          `沉默里，只有雨水敲打瓦檐。过了很久，那人才点头：「那我跟你走。」`,
        ]),
        paragraph([
          `「再等一潮？」`,
          `${who}摇头：「等不起。」`,
          `「那你带什么？」`,
          `「带能回来的理由。」`,
        ]),
        paragraph([
          `有人在通讯里问：「你违令了？」`,
          `${who}看着屏幕，只回了三个字：「先确认。」`,
          `对面停顿很久，最后发来一句：「注意风向。」`,
        ]),
      ])
    : pick(rand, [
        paragraph([
          `${who}把线索一条条钉在墙上：时间、地点、谁先说谎、谁最后离开。`,
          `越看越清楚——真正的关键不在事件本身，而在所有人默认不说破的那一层。`,
        ]),
        paragraph([
          `${who}对照两份报告，发现同一分钟里出现了互相矛盾的读数。`,
          `不是仪器坏了，更像有人希望${who}相信仪器坏了。`,
        ]),
        paragraph([
          `旧日志被翻到边角卷起的那一页。${who}停住了：那天的记录被人用另一种笔迹补过。`,
          `补写的人很谨慎，谨慎到几乎成功。`,
        ]),
      ]);

  const outlineHint = req.outline?.trim()
    ? `本章按提纲推进：${req.outline.trim().slice(0, 80)}。`
    : `本章围绕「${req.chapterTitle || "未命名章节"}」展开冲突与选择。`;

  const genreFlavor: Record<string, string[]> = {
    玄幻: [
      "灵力在经脉里躁动，像有什么东西要破壳而出。",
      "远处宗门灯阵忽然乱了一拍，像有人踩错了阵脚。",
    ],
    仙侠: [
      "剑鸣很细，细到像是从云层另一侧传来的一句提醒。",
      "山风过处，玉简自己亮了一瞬，又迅速暗下去。",
    ],
    都市: [
      "写字楼的玻璃幕墙把城市灯火切成一块块冷白的碎片。",
      "电梯数字停在不该停的楼层，门却迟迟不开。",
    ],
    历史: [
      "朝报墨迹未干，宫墙外的车马声却已经乱了次序。",
      "烛花爆了一下，案上的密折被风掀起一角。",
    ],
    科幻: [
      "舱壁的指示灯跳了三下，导航系统给出一个它也不确定的航线。",
      "潮汐模型突然溢出阈值，屏幕上多出一条不该存在的虚线。",
      "氧气读数正常，可空气闻起来像刚下过一场人造雨。",
    ],
    悬疑: [
      "那封信少了一角，而少掉的那一角，恰好能解释所有人的沉默。",
      "监控在关键的十二秒里只留下一片白屏。",
    ],
    言情: [
      "有些话不适合在雨里说，可雨偏偏下个不停。",
      "两人同时伸手去扶同一盏灯，又同时停住。",
    ],
    末日: [
      "罐头见了底，地图上的安全区又被红笔划掉一块。",
      "广播断断续续，只听清「不要靠近海岸」。",
    ],
    游戏: [
      "任务面板弹出新的条件，奖励栏却故意留白。",
      "隐藏成就闪了一下，条件写成：活着离开这里。",
    ],
    其他: [
      "故事在这里拐了一个弯，弯道外侧是未知。",
      "有人把钥匙放在桌上，却没有留下名字。",
    ],
  };

  const pacingBeat =
    style.traits.pacing === "快节奏推进"
      ? pick(rand, [
          `变故来得比预想更快。${who}来不及整理情绪，只能先把下一步走出去。`,
          `${who}没有给恐惧排队的时间——先行动，再解释。`,
        ])
      : pick(rand, [
          `一切并不急着给出答案。${who}愿意把这个夜晚再拉长一点，好让选择显得不那么像冲动。`,
          `${who}把脚步放慢，像在给自己最后一次反悔的机会，却终究没有用。`,
        ]);

  const ending =
    blend > 70
      ? pick(rand, [
          `章末留下一个与「${tropes[1] || tropes[0]}」相关的钩子——不是为了追热点，而是让读者忍不住翻到下一页。`,
          `${who}回头望了一眼，岸上的灯火忽然齐齐暗了一寸。`,
        ])
      : pick(rand, [
          `章末收在一个安静的动作上：${who}熄掉灯，却没有立刻睡着。`,
          `${who}把手套摘下来，放在桌上，像把某种身份暂时放下。`,
          `通讯器震了一下。${who}没有立刻去看。`,
        ]);

  const blocks = [
    opening,
    outlineHint,
    tropeBeat,
    pick(rand, genreFlavor[req.genre] || genreFlavor["其他"]),
    mid,
    pacingBeat,
    req.previousContext
      ? `承接上文的余波仍在：${req.previousContext.slice(0, 60)}……`
      : "",
    ending,
  ].filter(Boolean);

  let content = blocks.join("\n\n");

  const beatBank = shuffle(rand, [
    `${who}回忆起更早以前的一个细节，当时觉得无关紧要，现在却成了钥匙。`,
    `风从走廊尽头过来，带着纸张与尘土的气味。`,
    `有人在门外停了一停，又走开了。脚步很轻，轻得像故意。`,
    `计划需要修正。不是方向错了，是代价被低估了。`,
    `若把今晚写成一页书，最重要的句子大概还没出现。`,
    `${who}在心里默数三秒，把恐惧压回该在的位置。`,
    `仪器再次报警，这次短促得像一声冷笑。`,
    `窗外的潮线比记录里更高，高得不合规矩。`,
    `${who}把备用电源拨到手动，屏幕暗了一瞬又亮起。`,
    `有些秘密不是被藏起来的，是被所有人一起装作看不见。`,
    `雨停了，地上的反光却还在动，像仍有什么在下面路过。`,
    `${who}写下一行字，又划掉，只留下两个字：核实。`,
  ]);

  let i = 0;
  while (content.replace(/\s/g, "").length < words && i < beatBank.length * 2) {
    content += `\n\n${beatBank[i % beatBank.length]}`;
    i += 1;
  }

  if (style.sampleText.trim().length < 80) {
    notes.push("风格样本较短，建议在「文风指纹」中补充更多你的原文，以提升贴合度。");
  }

  return { content, mode: "demo", notes };
}

export async function generateChapter(req: WriteRequest): Promise<WriteResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return generateDemoChapter(req);
  }

  const system = `你是中文长篇小说的写作助手。根据作者文风与章节提纲创作原创正文。
硬性规则：
1. 绝不抄袭、改写或拼接任何已发表网文原文。
2. 热点题材/套路只作情节参考，叙述口吻必须服从作者风格。
3. 输出纯正文，不要标题解释，不要 markdown。
4. 目标字数约 ${clampWords(req.targetWords)} 字。`;

  const user = `题材：${req.genre}
章节标题：${req.chapterTitle}
章节提纲：${req.outline || "（无）"}
热点套路参考（融合度 ${req.trendBlend}%）：${req.selectedTropes.join("、") || "无"}
上文摘录：${req.previousContext?.slice(0, 500) || "（无）"}

作者文风要求：
${buildStylePrompt(req.style)}

作者样本（仅学习语气，勿复述）：
"""${req.style.sampleText.slice(0, 1200)}"""`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const demo = generateDemoChapter(req);
      demo.notes.unshift(`在线模型调用失败（${res.status}），已回退演示引擎。`);
      return demo;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return generateDemoChapter(req);
    }
    return {
      content,
      mode: "live",
      notes: ["已使用你配置的在线模型生成。请人工审校后再发布。"],
    };
  } catch {
    const demo = generateDemoChapter(req);
    demo.notes.unshift("在线模型网络异常，已回退演示引擎。");
    return demo;
  }
}

export function describeStyleForUi(profile: StyleProfile): string {
  return profile.traits.summary;
}
