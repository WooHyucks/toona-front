import { Skeleton } from "@/components/ui/skeleton";

export function HomeHeroSkeleton() {
  return (
    <div className="pb-2 pt-4 md:pb-4 md:pt-2">
      <div className="overflow-hidden rounded-2xl bg-card lg:rounded-3xl">
        <div className="relative h-[230px] md:hidden">
          <Skeleton className="absolute inset-0 rounded-none bg-elevated" />
        </div>
        <div className="hidden min-h-[280px] md:flex lg:min-h-[320px]">
          <div className="flex flex-1 flex-col justify-center gap-3 p-8 lg:p-10">
            <Skeleton className="h-5 w-28 bg-elevated" />
            <Skeleton className="h-9 w-3/4 max-w-md bg-elevated" />
            <Skeleton className="h-16 w-full max-w-lg bg-elevated" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-11 w-36 rounded-xl bg-elevated" />
              <Skeleton className="h-11 w-40 rounded-xl bg-elevated" />
            </div>
          </div>
          <Skeleton className="w-[42%] rounded-none bg-elevated lg:w-[44%]" />
        </div>
      </div>
    </div>
  );
}

export function RankingRailSkeleton() {
  return (
    <div className="mt-8 lg:mt-10">
      <Skeleton className="mb-4 h-5 w-40 bg-elevated" />
      <div className="flex gap-3 overflow-hidden md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-[31%] shrink-0 sm:w-[28%] md:w-[16.5%] lg:w-[14%]"
          >
            <Skeleton className="mb-2 aspect-[2/3] w-full rounded-xl bg-elevated md:rounded-2xl" />
            <Skeleton className="mb-1 h-3 w-4/5 bg-elevated" />
            <Skeleton className="h-2.5 w-1/2 bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-content px-4 pb-10 md:px-8 md:pb-16 lg:px-12">
      <div className="mb-2 flex items-center justify-between pt-3 md:hidden">
        <Skeleton className="h-7 w-24 bg-elevated" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-xl bg-elevated" />
          <Skeleton className="h-8 w-8 rounded-xl bg-elevated" />
        </div>
      </div>
      <HomeHeroSkeleton />
      <RankingRailSkeleton />
      <RankingRailSkeleton />
      <RankingRailSkeleton />
    </div>
  );
}
