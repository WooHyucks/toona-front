import { Skeleton } from "@/components/ui/skeleton";

export function WebtoonCardSkeleton() {
  return <Skeleton className="aspect-[2/3] w-full rounded-xl bg-elevated" />;
}

export function WebtoonGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <WebtoonCardSkeleton key={index} />
      ))}
    </div>
  );
}
