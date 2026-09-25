import { cn } from "@/lib/cn";

type AyahNumberProps = {
  number: number;
  /** Accessible label, e.g. t("reader.ayahMarker", { number }) */
  label: string;
  className?: string;
};

/** Presentation-only digit shaping — does not touch ayah/page data. */
function toArabicIndicDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]!);
}

function digitFontSizeEm(digitCount: number): string {
  if (digitCount >= 3) return "0.3em";
  if (digitCount === 2) return "0.36em";
  return "0.42em";
}

/**
 * Atomic Mushaf ayah-end medallion (same rosette design).
 * Box size uses `em` so markers scale with Quran typography when the
 * viewport-fit leaf shrinks — no redesign of the ornament.
 */
export function AyahNumber({ number, label, className }: AyahNumberProps) {
  const digits = toArabicIndicDigits(number);
  const fontSizeEm = digitFontSizeEm(digits.length);

  return (
    <>
      <style href="ayah-number-marker" precedence="ayah-number">{`
        .ayahNumber {
          display: inline-flex;
          position: relative;
          box-sizing: border-box;
          width: 1.12em;
          height: 1.12em;
          min-width: 1.12em;
          align-items: center;
          justify-content: center;
          vertical-align: middle;
          line-height: 1;
          white-space: nowrap;
          flex-shrink: 0;
          margin-inline: 0.14em;
          unicode-bidi: isolate;
          overflow: visible;
          transform: translateY(-0.04em);
        }
        .ayahNumberOrnament {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          pointer-events: none;
        }
        .ayahNumberDigits {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1;
          font-family: var(--font-arabic-ui), "IBM Plex Sans Arabic", sans-serif;
          font-weight: 600;
          color: #17624a;
          letter-spacing: normal;
          word-spacing: normal;
          pointer-events: none;
        }
      `}</style>

      <span
        role="img"
        aria-label={label}
        className={cn("ayahNumber", className)}
      >
        <svg
          className="ayahNumberOrnament"
          viewBox="0 0 42 42"
          width="42"
          height="42"
          aria-hidden="true"
          focusable="false"
        >
          <g
            fill="#F3E6C4"
            stroke="#B7923E"
            strokeWidth="1.85"
            strokeLinejoin="round"
          >
            <rect x="5" y="5" width="32" height="32" />
            <rect
              x="5"
              y="5"
              width="32"
              height="32"
              transform="rotate(45 21 21)"
            />
          </g>

          <g fill="#17624A">
            <circle cx="21" cy="2.4" r="1.35" />
            <circle cx="39.6" cy="21" r="1.35" />
            <circle cx="21" cy="39.6" r="1.35" />
            <circle cx="2.4" cy="21" r="1.35" />
            <circle cx="34.2" cy="7.8" r="1.15" />
            <circle cx="34.2" cy="34.2" r="1.15" />
            <circle cx="7.8" cy="34.2" r="1.15" />
            <circle cx="7.8" cy="7.8" r="1.15" />
          </g>

          <circle
            cx="21"
            cy="21"
            r="12.2"
            fill="#FBF6E9"
            stroke="#B7923E"
            strokeWidth="1.2"
          />
          <circle
            cx="21"
            cy="21"
            r="10.5"
            fill="none"
            stroke="#17624A"
            strokeWidth="1.35"
          />
        </svg>

        <span
          className="ayahNumberDigits"
          aria-hidden="true"
          style={{ fontSize: fontSizeEm }}
        >
          {digits}
        </span>
      </span>
    </>
  );
}
