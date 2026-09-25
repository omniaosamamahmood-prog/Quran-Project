import type { ReactNode } from "react";

type MushafPageFrameProps = {
  children: ReactNode;
};

/**
 * Ornate Mushaf leaf — emerald/gold frame unchanged.
 *
 * Desktop: LARGE readable width (≈70vw / up to 1100px). Height hugs the
 * Quran + page-number content (no forced viewport-tall empty paper).
 * max-height caps dense pages so the leaf stays on-screen without scroll.
 */
export function MushafPageFrame({ children }: MushafPageFrameProps) {
  return (
    <div className="mushaf-frame">
      <span aria-hidden className="mushaf-edge mushaf-edge-top" />
      <span aria-hidden className="mushaf-edge mushaf-edge-bottom" />
      <span aria-hidden className="mushaf-edge mushaf-edge-left" />
      <span aria-hidden className="mushaf-edge mushaf-edge-right" />
      <span aria-hidden className="mushaf-corner mushaf-corner-tl" />
      <span aria-hidden className="mushaf-corner mushaf-corner-tr" />
      <span aria-hidden className="mushaf-corner mushaf-corner-bl" />
      <span aria-hidden className="mushaf-corner mushaf-corner-br" />

      <div className="mushaf-page-body">{children}</div>

      <style>{`
        .mushaf-frame {
          --mushaf-emerald-deep: #0b4a34;
          --mushaf-emerald: #0f7a52;
          --mushaf-gold: #c9a227;
          --mushaf-paper: #faf6eb;
          --mushaf-border-w: 16px;
          --mushaf-corner-w: 36px;
          position: relative;
          box-sizing: border-box;
          width: min(100%, 36rem);
          margin-inline: auto;
          background: var(--mushaf-paper);
          padding: var(--mushaf-border-w);
          box-shadow: 0 6px 22px rgba(11, 74, 52, 0.09);
          display: flex;
          flex-direction: column;
        }

        /* Tablet / desktop: wide leaf; height follows content, capped to viewport */
        @media (min-width: 640px) {
          .mushaf-frame {
            --mushaf-border-w: 20px;
            --mushaf-corner-w: 44px;
            width: min(70vw, 56rem);
            max-width: 1100px;
            height: auto;
            max-height: var(--mushaf-available-h, 75dvh);
          }
        }
        @media (min-width: 1024px) {
          .mushaf-frame {
            --mushaf-border-w: 22px;
            --mushaf-corner-w: 48px;
            width: min(70vw, 1100px);
            max-width: 1100px;
          }
        }

        /*
          Content-driven body — no stretching that leaves blank paper above
          the page number. Dense pages are limited by frame max-height.
        */
        .mushaf-page-body {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          width: 100%;
          box-sizing: border-box;
          padding: 1rem 1.15rem 0.75rem;
        }
        @media (min-width: 640px) {
          .mushaf-page-body {
            padding: 1.15rem 2rem 0.85rem;
          }
        }
        @media (min-width: 1024px) {
          .mushaf-page-body {
            padding: 1.25rem 2.75rem 0.9rem;
          }
        }

        .mushaf-frame::before,
        .mushaf-frame::after {
          content: "";
          position: absolute;
          pointer-events: none;
          z-index: 5;
        }
        .mushaf-frame::before {
          inset: 4px;
          border: 1.25px solid var(--mushaf-emerald-deep);
          opacity: 0.92;
        }
        .mushaf-frame::after {
          inset: calc(var(--mushaf-border-w) - 3px);
          border: 1px solid var(--mushaf-gold);
          opacity: 0.7;
        }

        .mushaf-edge {
          position: absolute;
          z-index: 1;
          opacity: 0.72;
        }
        .mushaf-edge-top,
        .mushaf-edge-bottom {
          left: var(--mushaf-corner-w);
          right: var(--mushaf-corner-w);
          height: var(--mushaf-border-w);
          background-repeat: repeat;
          background-size: 56px var(--mushaf-border-w);
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='24' viewBox='0 0 56 24'><rect width='56' height='24' fill='%23faf6eb'/><path d='M0 12 Q14 4 28 12 T56 12' fill='none' stroke='%230f7a52' stroke-width='1.15' opacity='0.75'/><path d='M0 12 Q14 20 28 12 T56 12' fill='none' stroke='%230f7a52' stroke-width='1.15' opacity='0.75'/><circle cx='28' cy='12' r='1.8' fill='%23c9a227' opacity='0.75'/></svg>");
        }
        .mushaf-edge-top { top: 0; }
        .mushaf-edge-bottom { bottom: 0; transform: scaleY(-1); }

        .mushaf-edge-left,
        .mushaf-edge-right {
          top: var(--mushaf-corner-w);
          bottom: var(--mushaf-corner-w);
          width: var(--mushaf-border-w);
          background-repeat: repeat;
          background-size: var(--mushaf-border-w) 56px;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='56' viewBox='0 0 24 56'><rect width='24' height='56' fill='%23faf6eb'/><path d='M12 0 Q5 14 12 28 T12 56' fill='none' stroke='%230f7a52' stroke-width='1.15' opacity='0.75'/><path d='M12 0 Q19 14 12 28 T12 56' fill='none' stroke='%230f7a52' stroke-width='1.15' opacity='0.75'/><circle cx='12' cy='28' r='1.8' fill='%23c9a227' opacity='0.75'/></svg>");
        }
        .mushaf-edge-left { left: 0; }
        .mushaf-edge-right { right: 0; transform: scaleX(-1); }

        .mushaf-corner {
          position: absolute;
          z-index: 2;
          width: var(--mushaf-corner-w);
          height: var(--mushaf-corner-w);
          background-size: 100% 100%;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='52' height='52' viewBox='0 0 52 52'><rect width='52' height='52' fill='%23faf6eb'/><path d='M52 7 A45 45 0 0 0 7 52' fill='none' stroke='%230b4a34' stroke-width='1.7'/><path d='M52 16 A36 36 0 0 0 16 52' fill='none' stroke='%230f7a52' stroke-width='1.25'/><path d='M52 24 A28 28 0 0 0 24 52' fill='none' stroke='%23c9a227' stroke-width='1.05' opacity='0.85'/><circle cx='16' cy='16' r='6.5' fill='none' stroke='%23c9a227' stroke-width='1.55'/><circle cx='16' cy='16' r='3.2' fill='none' stroke='%230f7a52' stroke-width='1.15'/><circle cx='16' cy='16' r='1.45' fill='%23c9a227'/><circle cx='28' cy='10' r='1.1' fill='%230f7a52' opacity='0.7'/><circle cx='10' cy='28' r='1.1' fill='%230f7a52' opacity='0.7'/></svg>");
        }
        .mushaf-corner-tl { top: 0; left: 0; }
        .mushaf-corner-tr { top: 0; right: 0; transform: scaleX(-1); }
        .mushaf-corner-bl { bottom: 0; left: 0; transform: scaleY(-1); }
        .mushaf-corner-br { bottom: 0; right: 0; transform: scale(-1, -1); }

        @media (max-width: 639px) {
          .mushaf-edge { opacity: 0.55; }
          .mushaf-frame { box-shadow: 0 4px 16px rgba(11, 74, 52, 0.07); }
        }
      `}</style>
    </div>
  );
}
