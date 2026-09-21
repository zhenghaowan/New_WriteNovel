# 墨压 · AI 小说写作台

可安装到任意电脑的桌面软件：用你的文风写长篇，参考热榜题材，并在官方网站内阅读正版正文。

## 在其他电脑上使用（安装包）

在本机（或 CI）打好安装包后，把 `release/` 里的文件拷到目标电脑即可，**目标电脑不需要安装 Node / npm**。

```bash
npm install
npm run dist          # 按当前系统打包
# 或指定平台：
npm run dist:linux    # AppImage / deb
npm run dist:win      # 需在 Windows 或配置交叉编译
npm run dist:mac      # 需在 macOS
```

打包产物在 `release/`：

| 系统 | 文件 | 用法 |
|------|------|------|
| Linux | `墨压-*.AppImage` | 赋予执行权限后双击 |
| Linux | `墨压_*.deb` | `sudo dpkg -i` 安装 |
| Windows | `墨压 Setup *.exe` | 双击安装 |
| Windows | portable 版 | 解压即用 |
| macOS | `墨压-*.dmg` | 拖到应用程序 |

开发调试（需 Node）：

```bash
npm install
npm run desktop    # 打开软件窗口
npm run dev        # 仅浏览器 http://127.0.0.1:43123
```

## 官方站阅读正文（不是抓取）

你要的「读一下正文」，正确做法是：**在官方网站里读**。

- 点击榜单里的 **「官方站阅读」**：桌面版会打开内置阅读窗口，直接加载起点 / 晋江 / 番茄等**官方网页**
- 登录、付费、章节都在对方网站完成；本软件**不下载、不解析、不内嵌、不缓存**章节正文
- 「风格速写」仍是原创演示段落，用来感受题材写法，不是原作

把别人网站的章节抓进自己的软件界面展示，即使动机是「只是看看」，在技术与法律上仍属于未授权复制/传播。内置官方网页阅读则与你用浏览器打开是同一类行为。

## 功能概览

- 写作台 / 文风指纹 / AI 共写
- 榜单雷达（题材信号）
- 官方站阅读窗口 + 风格速写

## 可选大模型

`.env.local`：

```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

## 技术栈

Next.js（standalone）· Electron · electron-builder · TypeScript · Tailwind
