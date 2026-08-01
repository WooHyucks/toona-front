import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ellipsis(text: string, max = 18) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
