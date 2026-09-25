import Image from "next/image";
import { cn } from "@/lib/cn";

type RegisterVisualPanelProps = {
  title: string;
  subtitle: string;
  isArabic: boolean;
};

/**
 * Register image half — cream seam into the form, no dark overlays.
 * LTR: panel sits on the left so the photo’s cream wall dissolves into the form.
 * RTL: panel sits on the left of the reversed grid; fade uses logical `start`.
 */
export function RegisterVisualPanel({
  title,
  subtitle,
  isArabic,
}: RegisterVisualPanelProps) {
  return (
    <aside
      className={cn(
        "relative hidden h-full min-h-0 overflow-hidden bg-canvas lg:block",
        /* LTR: image left so cream wall (photo right) faces the form */
        !isArabic && "lg:order-1",
      )}
      aria-label={title}
    >
      <Image
        src="/images/registerbackground.png"
        alt=""
        fill
        priority
        sizes="50vw"
        className="object-cover object-[42%_40%]"
      />

      {/* Soft cream seam facing the form — IMAGE → warm fade → cream */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 z-[1] w-[18%] min-w-[5.5rem] max-w-[8rem]",
          isArabic
            ? "start-0 bg-linear-to-r from-canvas from-10% via-canvas/75 to-transparent rtl:bg-linear-to-l"
            : "end-0 bg-linear-to-l from-canvas from-10% via-canvas/75 to-transparent",
        )}
      />

      {/* Upper-middle copy on cream wall — not over Quran, not at bottom */}
      <div
        className={cn(
          "absolute top-[16%] z-[2] w-full max-w-[22rem] px-8 xl:px-10",
          isArabic ? "start-0" : "end-0",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-5 py-4",
            "bg-[#faf5ea]/65 backdrop-blur-[2px]",
          )}
        >
          <h2
            className={cn(
              "text-balance text-emerald-ink",
              isArabic
                ? "font-naskh text-[1.5rem] font-semibold leading-snug"
                : "font-display text-[1.35rem] font-semibold leading-snug tracking-tight",
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              "mt-2 text-[0.9rem] leading-relaxed text-emerald-deep/80",
              isArabic && "font-arabic",
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </aside>
  );
}
