import type { TrendEntry } from "./types";

/**
 * 根据榜单题材/套路信号生成「风格速写」。
 * 这是原创演示段落，用于粗略感受写法气质，绝非原作正文，也不来自任何网站抓取。
 */
export function buildStyleSketch(entry: Pick<
  TrendEntry,
  "title" | "genre" | "tropeSignals" | "styleSignals" | "platform"
>): { disclaimer: string; sketch: string; officialSearchUrl: string } {
  const trope = entry.tropeSignals[0] || "人物抉择";
  const style = entry.styleSignals[0] || "短句推进";
  const genre = entry.genre;

  const openings: Record<string, string> = {
    玄幻: "灵气在丹田里乱撞的时候，他听见外面有人笑了一声。",
    仙侠: "剑出鞘半寸，山风忽然停了。",
    都市: "电梯到了十八层，门却没有开。",
    历史: "密折展开的一瞬，烛火跳了一下。",
    科幻: "潮汐模型溢出了一条虚线，像有人在海里改了航道。",
    悬疑: "监控少了十二秒，刚好够一个人从走廊消失。",
    言情: "雨还在下，他把伞偏向了另一边。",
    末日: "广播断了，只剩风声和远处的狗吠。",
    游戏: "任务栏闪了一下：奖励未公开。",
  };

  const mid = `这一段并不属于任何已发表作品——只是按「${genre}」题材与「${trope}」信号，用「${style}」的节奏随手速写。若你想读真正的榜上书，请去 ${entry.platform} 官方页面。`;

  const beats = [
    openings[genre] || "夜色落下时，故事终于愿意往前走一步。",
    `有人把「${trope}」当成捷径；他更在意捷径尽头会不会塌。`,
    style.includes("对白")
      ? `「你还要继续？」\n「继续。」他说，「至少走到能回头的地方。」`
      : `他把线索压进下一句里，不解释，只推进。`,
    mid,
    `章末不必揭晓答案，只需让人想翻开下一页——而这，才是热榜常有的写法气质。`,
  ];

  const q = encodeURIComponent(`${entry.title} ${entry.platform}`);
  return {
    disclaimer:
      "以下为原创「风格速写」，用于粗略感受题材写法，不是榜上原作正文，亦非网站抓取内容。阅读正版请在「官方站阅读」窗口打开对应平台网页。",
    sketch: beats.join("\n\n"),
    officialSearchUrl: officialSearchUrl(entry.title, entry.platform),
  };
}

function platformSearchHost(platform: string): string {
  if (platform.includes("起点")) return "qidian.com";
  if (platform.includes("晋江")) return "jjwxc.net";
  if (platform.includes("番茄")) return "fanqienovel.com";
  if (platform.includes("七猫")) return "qimao.com";
  return "qidian.com";
}

export function platformHomeUrl(platform: string): string {
  if (platform.includes("起点")) return "https://www.qidian.com/";
  if (platform.includes("晋江")) return "https://www.jjwxc.net/";
  if (platform.includes("番茄")) return "https://fanqienovel.com/";
  if (platform.includes("七猫")) return "https://www.qimao.com/";
  return "https://www.qidian.com/";
}

export function officialSearchUrl(title: string, platform: string): string {
  const host = platformSearchHost(platform);
  // 指向平台站内搜索，用户在官方页面登录/阅读正版正文
  if (host === "qidian.com") {
    return `https://www.qidian.com/so/${encodeURIComponent(title)}.html`;
  }
  if (host === "jjwxc.net") {
    return `https://www.jjwxc.net/search.php?kw=${encodeURIComponent(title)}`;
  }
  if (host === "fanqienovel.com") {
    return `https://fanqienovel.com/search/${encodeURIComponent(title)}`;
  }
  return `https://www.bing.com/search?q=${encodeURIComponent(`${title} site:${host}`)}`;
}
