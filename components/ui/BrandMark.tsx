import { cn } from "@/lib/cn";

type BrandMarkProps = {
  className?: string;
};

/** Open mushaf with a gold bookmark, set in a soft sage tile. */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-sage",
        className,
      )}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-[1.375rem] w-[1.375rem]" fill="none">
        <path
          d="M4 6.6c2.8-1.1 5-1 6.6.5l1.4 1.3 1.4-1.3c1.6-1.5 3.8-1.6 6.6-.5v10.8c-2.8-1.1-5-1-6.6.5L12 19.2l-1.4-1.3c-1.6-1.5-3.8-1.6-6.6-.5V6.6Z"
          className="stroke-emerald"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M12 8.4v10.8"
          className="stroke-emerald/70"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M15.4 5.5v4.2l1.4-1 1.4 1V5.5"
          className="fill-gold-soft stroke-gold"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
