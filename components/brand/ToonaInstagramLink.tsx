import { FaInstagram } from "react-icons/fa";
import { cn } from "@/lib/utils";

export const TOONA_INSTAGRAM_URL = "https://www.instagram.com/toona_official/";

type Props = {
  className?: string;
  iconClassName?: string;
};

export function ToonaInstagramLink({ className, iconClassName }: Props) {
  return (
    <a
      href={TOONA_INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="투나 인스타그램"
      className={cn(
        "inline-flex items-center justify-center text-muted-foreground",
        className
      )}
    >
      <FaInstagram className={cn("h-5 w-5", iconClassName)} aria-hidden />
    </a>
  );
}
