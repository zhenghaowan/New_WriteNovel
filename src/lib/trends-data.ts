import type { Genre, TrendEntry, TrendSnapshot } from "./types";
import { officialSearchUrl } from "./style-sketch";

const PLATFORMS = [
  { platform: "起点中文网", boards: ["月票榜", "畅销榜", "推荐榜"] },
  { platform: "晋江文学城", boards: ["积分榜", "畅销榜", "收藏榜"] },
  { platform: "番茄小说", boards: ["热度榜", "新书榜", "完本榜"] },
  { platform: "七猫小说", boards: ["热搜榜", "畅销榜"] },
];

const GENRE_POOL: Genre[] = [
  "玄幻",
  "仙侠",
  "都市",
  "历史",
  "科幻",
  "悬疑",
  "言情",
  "末日",
  "游戏",
];

const TITLE_SEEDS = [
  ["长夜", "星火", "归途", "无声", "潮汐", "烬城", "青瓷", "旧盟", "雾港", "断桥"],
  ["之", "与", "在", "里的", "之后", "之前", "尽头", "回响", "密码", "纪元"],
  ["守夜人", "漂流者", "执灯人", "逆行者", "造梦师", "拾荒客", "观星者", "织网人"],
];

const TROPE_BANK: Record<string, string[]> = {
  玄幻: ["废柴逆袭", "宗门大比", "隐藏血脉", "炼体流", "穿越开局"],
  仙侠: ["双修羁绊", "问道长生", "剑修好感", "宗门秘闻", "仙凡之恋"],
  都市: ["职场博弈", "重生改命", "隐秘身份", "商战反杀", "都市异能"],
  历史: ["权谋布局", "朝堂暗潮", "边关战事", "身份互换", "经世济民"],
  科幻: ["赛博义体", "星际殖民", "时间闭环", "AI觉醒", "末日方舟"],
  悬疑: ["不可靠叙述", "多重反转", "密室线索", "记忆缺失", "身份嵌套"],
  言情: ["欢喜冤家", "追妻火葬场", "破镜重圆", "先婚后爱", "双向奔赴"],
  末日: ["资源争夺", "基地建设", "异变进化", "人性抉择", "小队生存"],
  游戏: ["副本攻略", "隐藏职业", "全息网游", "NPC觉醒", "排行冲榜"],
  其他: ["群像叙事", "多线交织", "成长线"],
};

const STYLE_SIGNALS = [
  "短句推进",
  "强对白驱动",
  "信息密度高",
  "章末钩子",
  "情绪反差",
  "世界观碎片化披露",
  "爽点前置",
  "慢热人物弧",
  "意象化环境描写",
  "系统面板穿插",
];

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], seed: string): T {
  return arr[hash(seed) % arr.length];
}

function makeTitle(seed: string): string {
  const a = pick(TITLE_SEEDS[0], seed + "a");
  const b = pick(TITLE_SEEDS[1], seed + "b");
  const c = pick(TITLE_SEEDS[2], seed + "c");
  const mode = hash(seed) % 3;
  if (mode === 0) return `${a}${b}${c}`;
  if (mode === 1) return `${c}${a}`;
  return `${a}${c}`;
}

function makeAuthor(seed: string): string {
  const surnames = ["陆", "沈", "江", "楚", "顾", "白", "苏", "谢", "程", "叶"];
  const names = ["一舟", "南星", "听雨", "晚晴", "知秋", "无咎", "清和", "言蹊", "未央", "栖迟"];
  return pick(surnames, seed + "s") + pick(names, seed + "n");
}

function makeEntry(
  platform: string,
  board: string,
  rank: number,
  dayKey: string,
): TrendEntry {
  const seed = `${dayKey}|${platform}|${board}|${rank}`;
  const genre = pick(GENRE_POOL, seed + "g");
  const tropes = TROPE_BANK[genre] || TROPE_BANK["其他"];
  const tropeSignals = [
    pick(tropes, seed + "t1"),
    pick(tropes, seed + "t2"),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
  const styleSignals = [
    pick(STYLE_SIGNALS, seed + "s1"),
    pick(STYLE_SIGNALS, seed + "s2"),
  ];
  const tags = [...tropeSignals, genre].slice(0, 4);
  const title = makeTitle(seed);
  const heat = 100000 - rank * 700 + (hash(seed) % 900);

  return {
    rank,
    title,
    author: makeAuthor(seed),
    platform,
    board,
    genre,
    tags,
    heat,
    tropeSignals,
    styleSignals,
    officialSearchUrl: officialSearchUrl(title, platform),
  };
}

/** 生成当日趋势快照：仅榜单元数据与题材信号，不含任何作品正文。 */
export function buildTrendSnapshot(now = new Date()): TrendSnapshot {
  const dayKey = now.toISOString().slice(0, 10);
  const boards = PLATFORMS.flatMap(({ platform, boards }) =>
    boards.map((name) => ({
      name,
      platform,
      entries: Array.from({ length: 100 }, (_, i) =>
        makeEntry(platform, name, i + 1, dayKey),
      ),
    })),
  );

  const genreCount = new Map<string, number>();
  const tropeCount = new Map<string, { count: number; boards: Set<string> }>();
  const styleCount = new Map<string, number>();

  for (const board of boards) {
    for (const entry of board.entries.slice(0, 100)) {
      genreCount.set(entry.genre, (genreCount.get(entry.genre) || 0) + 1);
      for (const trope of entry.tropeSignals) {
        const cur = tropeCount.get(trope) || { count: 0, boards: new Set<string>() };
        cur.count += 1;
        cur.boards.add(`${board.platform}·${board.name}`);
        tropeCount.set(trope, cur);
      }
      for (const s of entry.styleSignals) {
        styleCount.set(s, (styleCount.get(s) || 0) + 1);
      }
    }
  }

  const total = [...genreCount.values()].reduce((a, b) => a + b, 0) || 1;
  const hotGenres = [...genreCount.entries()]
    .map(([genre, n]) => ({
      genre,
      share: Math.round((n / total) * 1000) / 10,
      rising: hash(dayKey + genre) % 2 === 0,
    }))
    .sort((a, b) => b.share - a.share);

  const hotTropes = [...tropeCount.entries()]
    .map(([trope, v]) => ({
      trope,
      count: v.count,
      boards: [...v.boards].slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const styleInsights = [...styleCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(
      ([signal, n]) =>
        `近三日各榜前 100 中，「${signal}」相关信号出现 ${n} 次，适合在章末与冲突段使用。`,
    );

  return {
    fetchedAt: now.toISOString(),
    sourceNote:
      "演示数据：模拟主流小说站各榜前 100 的题材/标签/热度信号，不含作品正文。正式环境应使用官方开放数据或授权接口，切勿抓取受版权保护的章节全文。",
    boards,
    hotGenres,
    hotTropes,
    styleInsights,
  };
}
