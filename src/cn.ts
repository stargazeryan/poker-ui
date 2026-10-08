import { twMerge } from "tailwind-merge";

/** Join class names and resolve conflicting Tailwind utilities (last wins). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(" "));
}
