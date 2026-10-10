"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  title: string;
  className?: string;
  priority?: boolean;
};

export function FindCover({ src, title, className, priority }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src?.trim()) && !failed;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-elevated",
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={title}
          referrerPolicy="no-referrer"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-elevated"
          aria-hidden
        >
          <BookOpen className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
