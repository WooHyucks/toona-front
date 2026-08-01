import {
  BookOpen,
  Calendar,
  Compass,
  Flame,
  Heart,
  Search,
  Sparkles,
  Swords,
  Target,
  Theater,
  type LucideIcon,
} from "lucide-react";
import { SiKakao, SiNaver } from "react-icons/si";
import { cn } from "@/lib/utils";

export type SectionIconId =
  | "trending"
  | "for-you"
  | "today"
  | "fantasy"
  | "romance"
  | "completed"
  | "naver"
  | "kakao"
  | "drama"
  | "search"
  | "compass";

type IconComponent = LucideIcon | typeof SiNaver;

const ICONS: Record<SectionIconId, IconComponent> = {
  trending: Flame,
  "for-you": Sparkles,
  today: Calendar,
  fantasy: Swords,
  romance: Heart,
  completed: BookOpen,
  naver: SiNaver,
  kakao: SiKakao,
  drama: Theater,
  search: Search,
  compass: Compass,
};

export function SectionIcon({
  id,
  className,
}: {
  id: SectionIconId | string;
  className?: string;
}) {
  const Icon = ICONS[id as SectionIconId] ?? Sparkles;
  return <Icon className={cn("shrink-0", className)} aria-hidden />;
}
