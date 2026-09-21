import { Suspense } from "react";
import { StudioApp } from "@/components/studio/studio-app";

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          正在打开墨压工作室…
        </div>
      }
    >
      <StudioApp />
    </Suspense>
  );
}
