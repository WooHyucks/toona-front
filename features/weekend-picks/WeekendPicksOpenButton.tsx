"use client";

type Props = {
  available: boolean;
  onOpen: () => void;
  className?: string;
};

export function WeekendPicksOpenButton({ available, onOpen, className }: Props) {
  if (!available) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        className ??
        "mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-[15px] font-semibold text-primary-foreground"
      }
    >
      🔥 이번 주말, 투나가 골라줘
    </button>
  );
}
