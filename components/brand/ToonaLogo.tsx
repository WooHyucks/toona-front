import Image from "next/image";
import { cn } from "@/lib/utils";

type ToonaLogoProps = {
  className?: string;
  /** Context size — each scales across breakpoints */
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
};

/** Cropped logo is 480×140 (~3.43:1) */
const SIZES = {
  sm: {
    width: 160,
    height: 47,
    className: "h-10 w-auto sm:h-11 md:h-10",
  },
  md: {
    width: 200,
    height: 58,
    className: "h-11 w-auto lg:h-[38px]",
  },
  lg: {
    width: 240,
    height: 70,
    className: "h-12 w-auto sm:h-14 md:h-16",
  },
  xl: {
    width: 360,
    height: 105,
    className:
      "h-[72px] w-auto max-w-[min(80vw,300px)] sm:h-20 sm:max-w-[340px] md:h-24 md:max-w-[400px]",
  },
} as const;

export function ToonaLogo({
  className,
  size = "md",
  priority = false,
}: ToonaLogoProps) {
  const s = SIZES[size];

  return (
    <Image
      src="/images/logo.png"
      alt="Toona"
      width={s.width}
      height={s.height}
      priority={priority}
      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 240px, 320px"
      className={cn(s.className, "object-contain object-left", className)}
    />
  );
}
