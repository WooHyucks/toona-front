import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function WebtoonCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="aspect-[2/3] w-full rounded-[16px]" />
      <Skeleton className="h-4 w-[80%] rounded-md" />
      <Skeleton className="h-3 w-1/2 rounded-md" />
    </div>
  );
}

export function HomeHeroSkeleton() {
  return (
    <div className="space-y-4 rounded-[20px] bg-card p-4">
      <Skeleton className="aspect-[2/3] max-h-[360px] w-full rounded-[18px]" />
      <Skeleton className="h-6 w-[66%]" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

export function RailSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <WebtoonCardSkeleton key={i} className="w-[34%] shrink-0" />
        ))}
      </div>
    </div>
  );
}

export function RecommendationCardSkeleton() {
  return (
    <div className="space-y-4 rounded-[20px] border bg-card p-4">
      <Skeleton className="aspect-[2/3] w-full rounded-[18px]" />
      <Skeleton className="h-6 w-[75%]" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[83%]" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
