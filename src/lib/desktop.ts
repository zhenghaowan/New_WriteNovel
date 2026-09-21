"use client";

export type InkpressDesktop = {
  isDesktop: true;
  openOfficialReader: (url: string) => Promise<{ ok: boolean }>;
};

declare global {
  interface Window {
    inkpress?: InkpressDesktop;
  }
}

export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && Boolean(window.inkpress?.isDesktop);
}

/** 在桌面版内打开官方站阅读窗口；浏览器环境则新标签打开。 */
export async function openOfficialReader(url: string): Promise<void> {
  if (!url) return;
  if (window.inkpress?.openOfficialReader) {
    await window.inkpress.openOfficialReader(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
