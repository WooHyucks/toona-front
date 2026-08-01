import { cn } from "@/lib/utils";

type DesktopContentProps = {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
};

/** Centers page content with editorial max-width and desktop margins */
export function DesktopContent({
  children,
  className,
  narrow = false,
}: DesktopContentProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full overflow-x-hidden px-4 md:px-8 lg:px-12",
        narrow ? "max-w-3xl" : "max-w-content",
        className
      )}
    >
      {children}
    </div>
  );
}

type DesktopPageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function DesktopPageHeader({
  title,
  description,
  action,
  className,
}: DesktopPageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex items-end justify-between gap-4 pt-4 md:pt-6 lg:pt-8",
        className
      )}
    >
      <div>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[24px] lg:text-[26px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-muted-foreground md:text-[14px]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
