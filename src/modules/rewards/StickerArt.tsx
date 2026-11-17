import type { StickerKind } from './rewards';

interface StickerArtProps {
  kind: StickerKind;
  className?: string;
}

const outline = '#6b5568';

/** Pegatinas dibujadas en SVG local: nítidas, ligeras y 100 % offline. */
export function StickerArt({ kind, className }: StickerArtProps) {
  const commonProps = {
    className,
    viewBox: '0 0 100 100',
    role: 'img' as const,
    'aria-hidden': true,
    focusable: false,
  };

  switch (kind) {
    case 'mochi':
      return (
        <svg {...commonProps}>
          <ellipse cx="50" cy="89" rx="25" ry="4.5" fill="#e6cfe8" opacity="0.6" />
          <path d="M27 45C21 29 22 19 29 21c7 2 13 10 16 17Z" fill="#fff0f8" stroke={outline} strokeWidth="3" strokeLinejoin="round" />
          <path d="M73 45c6-16 5-26-2-24-7 2-13 10-16 17Z" fill="#fff0f8" stroke={outline} strokeWidth="3" strokeLinejoin="round" />
          <path d="M50 27c18 0 28 10 28 23 0 14-12 23-28 23S22 64 22 50c0-13 10-23 28-23Z" fill="#fffafc" stroke={outline} strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="40" cy="49" rx="3.6" ry="4.8" fill="#5a4657" />
          <ellipse cx="60" cy="49" rx="3.6" ry="4.8" fill="#5a4657" />
          <circle cx="39" cy="47" r="1.3" fill="#fff" />
          <circle cx="59" cy="47" r="1.3" fill="#fff" />
          <ellipse cx="31" cy="57" rx="4.5" ry="2.5" fill="#ff9fbe" opacity="0.65" />
          <ellipse cx="69" cy="57" rx="4.5" ry="2.5" fill="#ff9fbe" opacity="0.65" />
          <path d="M47 55c1-1.2 5-1.2 6 0 0 2-1.4 3.2-3 3.2S47 57 47 55Z" fill="#f08ca8" />
          <path d="M45 61c1.7 2.2 3.8 2.2 5 0 1.2 2.2 3.3 2.2 5 0" fill="none" stroke={outline} strokeWidth="1.8" strokeLinecap="round" />
          <g transform="translate(72 31) rotate(16)">
            <ellipse cx="-5" cy="0" rx="5" ry="3.6" fill="#8fe3c9" stroke={outline} strokeWidth="2" />
            <ellipse cx="5" cy="0" rx="5" ry="3.6" fill="#8fe3c9" stroke={outline} strokeWidth="2" />
            <circle cx="0" cy="0" r="2.2" fill="#ffe08a" stroke={outline} strokeWidth="1.8" />
          </g>
        </svg>
      );

    case 'rainbow':
      return (
        <svg {...commonProps}>
          <path d="M12 72a38 38 0 0 1 76 0" fill="none" stroke="#ffb3c8" strokeWidth="11" strokeLinecap="round" />
          <path d="M22 72a28 28 0 0 1 56 0" fill="none" stroke="#ffdf7a" strokeWidth="10" strokeLinecap="round" />
          <path d="M32 72a18 18 0 0 1 36 0" fill="none" stroke="#8fe3c9" strokeWidth="9" strokeLinecap="round" />
          <path d="M6 82c-4 0-7-3-7-6.5S2 69 6 69c0-5 4-9 9-9 4 0 8 2 10 6 4 0 8 2 8 7 0 5-4 9-9 9Z" fill="#fffafc" stroke={outline} strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M94 82c4 0 7-3 7-6.5S98 69 94 69c0-5-4-9-9-9-4 0-8 2-10 6-4 0-8 2-8 7 0 5 4 9 9 9Z" fill="#fffafc" stroke={outline} strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx="14" cy="73" r="1.7" fill={outline} />
          <circle cx="25" cy="73" r="1.7" fill={outline} />
          <path d="M18 77c1.2 1.4 2.8 1.4 4 0" fill="none" stroke={outline} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="76" cy="73" r="1.7" fill={outline} />
          <circle cx="87" cy="73" r="1.7" fill={outline} />
          <path d="M80 77c1.2 1.4 2.8 1.4 4 0" fill="none" stroke={outline} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M50 10c.5 3.2 1.8 4.5 5 5-3.2.5-4.5 1.8-5 5-.5-3.2-1.8-4.5-5-5 3.2-.5 4.5-1.8 5-5Z" fill="#ffe08a" />
        </svg>
      );

    case 'star':
      return (
        <svg {...commonProps}>
          <path d="M50 9 61.5 33 88 36.5 68.5 55.2 73.5 81 50 68 26.5 81l5-25.8L12 36.5 38.5 33Z" fill="#ffdf7a" stroke={outline} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="42.5" cy="47" r="2.8" fill={outline} />
          <circle cx="57.5" cy="47" r="2.8" fill={outline} />
          <circle cx="41.4" cy="45.8" r="1" fill="#fff" />
          <circle cx="56.4" cy="45.8" r="1" fill="#fff" />
          <ellipse cx="34" cy="54" rx="4" ry="2.2" fill="#ff9fbe" opacity="0.7" />
          <ellipse cx="66" cy="54" rx="4" ry="2.2" fill="#ff9fbe" opacity="0.7" />
          <path d="M45 54c1.6 2 3.4 2 5 0 1.6 2 3.4 2 5 0" fill="none" stroke={outline} strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );

    case 'flower':
      return (
        <svg {...commonProps}>
          <g fill="#ffb3c8" stroke={outline} strokeWidth="2.8">
            <ellipse cx="50" cy="24" rx="11" ry="15" />
            <ellipse cx="50" cy="24" rx="11" ry="15" transform="rotate(72 50 45)" />
            <ellipse cx="50" cy="24" rx="11" ry="15" transform="rotate(144 50 45)" />
            <ellipse cx="50" cy="24" rx="11" ry="15" transform="rotate(216 50 45)" />
            <ellipse cx="50" cy="24" rx="11" ry="15" transform="rotate(288 50 45)" />
          </g>
          <circle cx="50" cy="45" r="15" fill="#ffe08a" stroke={outline} strokeWidth="3" />
          <circle cx="44.5" cy="43" r="2.4" fill={outline} />
          <circle cx="55.5" cy="43" r="2.4" fill={outline} />
          <circle cx="43.6" cy="42" r="0.9" fill="#fff" />
          <circle cx="54.6" cy="42" r="0.9" fill="#fff" />
          <ellipse cx="38" cy="49" rx="3.2" ry="1.8" fill="#ff9fbe" opacity="0.65" />
          <ellipse cx="62" cy="49" rx="3.2" ry="1.8" fill="#ff9fbe" opacity="0.65" />
          <path d="M46 50c1.2 1.6 2.8 1.6 4 0 1.2 1.6 2.8 1.6 4 0" fill="none" stroke={outline} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M50 82c-1-7-4-10-9-12 6-1 10 2 12 7 1-5 4-8 9-9-3 4-4 8-5 14Z" fill="#8fe3c9" stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      );

    case 'cupcake':
      return (
        <svg {...commonProps}>
          <path d="M29 59 36 88h28l7-29Z" fill="#8fe3c9" stroke={outline} strokeWidth="3" strokeLinejoin="round" />
          <path d="M38 61 42 86M50 61v25M62 61 58 86" stroke="#5fc8a9" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M28 59c-8 0-12-7-8-13 2-4 7-6 11-4 1-8 8-13 14-11 4-6 12-6 16 0 8-1 14 5 13 12 5 2 7 6 6 11-1 4-5 5-10 5Z" fill="#ffb3c8" stroke={outline} strokeWidth="3" strokeLinejoin="round" />
          <path d="M31 46c4-5 9-4 10 0 1-5 7-6 9-1" fill="none" stroke="#ff8fae" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="50" cy="17" r="6.5" fill="#ff8fae" stroke={outline} strokeWidth="2.6" />
          <path d="M50 10c1-4 4-5 7-5" fill="none" stroke={outline} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="43" cy="48" r="2.5" fill={outline} />
          <circle cx="57" cy="48" r="2.5" fill={outline} />
          <circle cx="42.1" cy="47" r="0.9" fill="#fff" />
          <circle cx="56.1" cy="47" r="0.9" fill="#fff" />
          <ellipse cx="37" cy="53" rx="3" ry="1.7" fill="#ff6f9f" opacity="0.55" />
          <ellipse cx="63" cy="53" rx="3" ry="1.7" fill="#ff6f9f" opacity="0.55" />
          <path d="M46 54c1.3 1.6 2.8 1.6 4 0 1.2 1.6 2.7 1.6 4 0" fill="none" stroke={outline} strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );

    case 'crown':
      return (
        <svg {...commonProps}>
          <path d="M15 79 11 31l21 17L50 20l18 28 21-17-4 48Z" fill="#ffdf7a" stroke={outline} strokeWidth="3" strokeLinejoin="round" />
          <rect x="15" y="70" width="70" height="13" rx="5" fill="#ffcf57" stroke={outline} strokeWidth="3" />
          <circle cx="11" cy="31" r="4.5" fill="#ffb3c8" stroke={outline} strokeWidth="2" />
          <circle cx="50" cy="20" r="4.5" fill="#8fe3c9" stroke={outline} strokeWidth="2" />
          <circle cx="89" cy="31" r="4.5" fill="#b9ddff" stroke={outline} strokeWidth="2" />
          <circle cx="31" cy="77" r="3" fill="#ff9fbe" stroke={outline} strokeWidth="1.6" />
          <circle cx="50" cy="77" r="3" fill="#8fe3c9" stroke={outline} strokeWidth="1.6" />
          <circle cx="69" cy="77" r="3" fill="#9fd5ff" stroke={outline} strokeWidth="1.6" />
          <circle cx="41" cy="52" r="2.5" fill={outline} />
          <circle cx="59" cy="52" r="2.5" fill={outline} />
          <circle cx="40.1" cy="51" r="0.9" fill="#fff" />
          <circle cx="58.1" cy="51" r="0.9" fill="#fff" />
          <ellipse cx="34" cy="58" rx="3.4" ry="1.9" fill="#ff9fbe" opacity="0.65" />
          <ellipse cx="66" cy="58" rx="3.4" ry="1.9" fill="#ff9fbe" opacity="0.65" />
          <path d="M45 59c1.5 1.8 3.5 1.8 5 0 1.5 1.8 3.5 1.8 5 0" fill="none" stroke={outline} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M22 14c.4 2.6 1.4 3.6 4 4-2.6.4-3.6 1.4-4 4-.4-2.6-1.4-3.6-4-4 2.6-.4 3.6-1.4 4-4Z" fill="#ffe08a" />
          <path d="M82 12c.4 2.6 1.4 3.6 4 4-2.6.4-3.6 1.4-4 4-.4-2.6-1.4-3.6-4-4 2.6-.4 3.6-1.4 4-4Z" fill="#ffb3c8" />
        </svg>
      );

    default:
      return null;
  }
}
