import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  className?: string;
  label?: string;
  fullPage?: boolean;
};

export function LoadingSpinner({
  className,
  label = "불러오는 중",
  fullPage = false,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        fullPage ? "min-h-[100dvh] w-full" : "min-h-[40vh] w-full p-6",
        className
      )}
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
