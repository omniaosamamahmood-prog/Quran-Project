import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
  tone?: "ink" | "light";
  /** Render the geometric mark after the label instead of before it. */
  markAfter?: boolean;
};

/**
 * The single recurring Islamic motif in the interface: a small eight-point
 * mark beside section titles. It is not repeated anywhere else.
 */
export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
  tone = "ink",
  markAfter = false,
}: SectionHeadingProps) {
  const mark = (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn(
        "h-3 w-3 shrink-0",
        tone === "ink" ? "text-gold" : "text-white/60",
      )}
      fill="none"
    >
      <path
        d="M8 1.5 9 6.2 13.5 5 10.6 8 13.5 11 9 9.8 8 14.5 7 9.8 2.5 11 5.4 8 2.5 5 7 6.2Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <Tag
      className={cn(
        "flex items-center gap-2.5 text-[0.9375rem] font-semibold",
        tone === "ink" ? "text-ink" : "text-white",
        className,
      )}
    >
      {markAfter ? null : mark}
      {children}
      {markAfter ? mark : null}
    </Tag>
  );
}
