type RubAlHizbMarkerProps = {
  /** Accessible name, e.g. "ربع الحزب، الحزب ١، الربع ٢". */
  label: string;
};

/**
 * Presentational Rubʿ al-Hizb ornament. It is not part of the ayah text.
 */
export function RubAlHizbMarker({ label }: RubAlHizbMarkerProps) {
  return (
    <>
      <style href="rub-al-hizb-marker" precedence="rub-al-hizb">{`
        .rub-al-hizb {
          display: inline-block;
          margin-inline: 0.06em 0.14em;
          color: #8d6a1a;
          font-size: 0.92em;
          line-height: 1;
          vertical-align: -0.06em;
          unicode-bidi: isolate;
          white-space: nowrap;
          user-select: none;
        }
      `}</style>
      <span
        className="rub-al-hizb"
        role="img"
        aria-label={label}
        title={label}
      >
        <span aria-hidden="true">۞</span>
      </span>
    </>
  );
}
