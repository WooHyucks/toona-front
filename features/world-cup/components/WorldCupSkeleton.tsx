"use client";

export function WorldCupSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-4 pb-8 pt-4 md:max-w-xl md:px-6"
      aria-busy
      aria-label="월드컵 불러오는 중"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-card" />
        <div className="ml-auto h-8 flex-1 max-w-[160px] animate-pulse rounded-lg bg-card" />
      </div>

      <div className="mx-auto mb-5 h-5 w-48 animate-pulse rounded bg-card" />

      <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-card" />
          <div className="mt-2 h-3.5 w-[80%] animate-pulse rounded bg-card" />
          <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-card" />
        </div>
        <div className="min-w-0">
          <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-card" />
          <div className="mt-2 h-3.5 w-[75%] animate-pulse rounded bg-card" />
          <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-card" />
        </div>
      </div>

      <div className="mt-6 h-12 w-full animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
