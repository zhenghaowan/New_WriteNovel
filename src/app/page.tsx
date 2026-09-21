import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div>
      <section className="landing-hero">
        <div className="landing-inner">
          <p className="brand-hero">墨压</p>
          <h1 className="hero-line">用你的笔触写长篇，让热榜只做风向标。</h1>
          <p className="hero-sub">
            可安装到任意电脑的写作软件。热榜只作题材风向；正文请在内置窗口打开官方网站阅读。
          </p>
          <div className="hero-actions">
            <Link href="/studio" className={cn(buttonVariants({ size: "lg" }))}>
              打开写作台
            </Link>
            <Link
              href="/studio?panel=trends"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white",
              )}
            >
              进入榜单雷达
            </Link>
          </div>
          <p className="mt-4 max-w-xl text-xs leading-6 text-white/55">
            分发安装：在开发机执行 <code className="rounded bg-white/10 px-1">npm run dist</code>，
            将 <code className="rounded bg-white/10 px-1">release/</code> 中的安装包拷到其他电脑即可，无需再装 Node。
          </p>
        </div>
      </section>

      <section className="landing-section">
        <h2>怎么写</h2>
        <div className="feature-row">
          <div className="feature-block">
            <h3>1. 留下文风指纹</h3>
            <p>
              粘贴你自己的旧稿或随笔。系统分析句长、对白密度、视角与语气，写作时优先贴合你，而不是模仿别人。
            </p>
          </div>
          <div className="feature-block">
            <h3>2. 读懂热榜信号</h3>
            <p>
              汇总起点、晋江、番茄、七猫等榜单前 100 的题材与标签趋势。只取元数据与套路信号，不抓取正版正文。
            </p>
          </div>
          <div className="feature-block">
            <h3>3. AI 共写章节</h3>
            <p>
              设定提纲与热点融合度，一键起草本章。可接 OpenAI 兼容接口；未配置密钥时也有本地演示引擎可用。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
