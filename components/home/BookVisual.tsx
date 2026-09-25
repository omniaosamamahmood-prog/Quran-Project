import { cn } from "@/lib/cn";

type BookVisualProps = {
  className?: string;
};

/**
 * Abstract open-mushaf visual: layered pages, a bookmark ribbon and a thin
 * geometric frame. Deliberately contains no text of any kind.
 */
export function BookVisual({ className }: BookVisualProps) {
  const leftPage = "M160 70c-16-13-40-18-70-14-10 1-16 8-16 17v60c0 9 7 15 16 14 28-3 52 2 70 15V70Z";
  const rightPage = "M160 70c16-13 40-18 70-14 10 1 16 8 16 17v60c0 9-7 15-16 14-28-3-52 2-70 15V70Z";

  return (
    <svg
      aria-hidden
      viewBox="0 0 320 228"
      fill="none"
      className={cn("h-auto w-full", className)}
    >
      {/* Thin geometric frame */}
      <rect
        x="10"
        y="10"
        width="300"
        height="208"
        rx="20"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.16"
      />

      {/* Stacked page edges beneath the book */}
      <path
        d="M66 172c32-13 60-13 94 1 34-14 62-14 94-1"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.22"
      />
      <path
        d="M58 182c34-14 64-14 102 1 38-15 68-15 102-1"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.14"
      />

      {/* Page fills */}
      <path d={leftPage} fill="currentColor" opacity="0.08" />
      <path d={rightPage} fill="currentColor" opacity="0.14" />

      {/* Page outlines */}
      <path
        d={leftPage}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d={rightPage}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.6"
      />

      {/* Spine */}
      <path
        d="M160 70v92"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Bookmark ribbon */}
      <path
        d="M198 56v42l11-8 11 8V56"
        className="fill-gold/70 stroke-gold"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Single restrained eight-point mark */}
      <path
        d="M160 26l2.7 6.6 6.6 2.7-6.6 2.7-2.7 6.6-2.7-6.6-6.6-2.7 6.6-2.7L160 26Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}
