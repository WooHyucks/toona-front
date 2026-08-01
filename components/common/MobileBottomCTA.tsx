"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileBottomCTAProps = {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
};

export function MobileBottomCTA({
  children,
  className,
  visible = true,
}: MobileBottomCTAProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 md:static md:pointer-events-auto",
        className
      )}
    >
      <div className="pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-8 md:bg-none md:p-0">
        <div className="pointer-events-auto mx-auto w-full max-w-app md:max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PrimaryCTAButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("h-[54px] w-full text-[15px] font-semibold", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
