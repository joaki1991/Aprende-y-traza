import styles from './MochiCat.module.css';

interface MochiCatProps {
  className?: string;
}

/**
 * Mascota oficial de Aprende y Traza. Es SVG local, sin imágenes externas,
 * para que funcione perfectamente offline y escale sin perder nitidez.
 */
export function MochiCat({ className }: MochiCatProps) {
  const classes = [styles.mochi, className].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      viewBox="0 0 260 250"
      role="img"
      aria-label="Mochi, la gatita"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mochi-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#fff0f8" />
        </linearGradient>
        <linearGradient id="mochi-pencil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffdb7e" />
          <stop offset="1" stopColor="#ffb84d" />
        </linearGradient>
        <linearGradient id="mochi-bow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a5efd7" />
          <stop offset="1" stopColor="#6ed9b5" />
        </linearGradient>
      </defs>

      <ellipse cx="130" cy="233" rx="76" ry="11" fill="#e6cfe8" opacity="0.55" />

      <path
        className={styles.tail}
        d="M184 208c32 8 44-18 31-34-8-10-22-7-24 4-2 9 8 12 14 6"
        fill="none"
        stroke="#6b5568"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        className={styles.tail}
        d="M184 208c32 8 44-18 31-34-8-10-22-7-24 4-2 9 8 12 14 6"
        fill="none"
        stroke="url(#mochi-fur)"
        strokeWidth="12.5"
        strokeLinecap="round"
      />

      <path
        d="M78 229c-15-31-9-71 9-85 10-8 24-11 43-11s33 3 43 11c18 14 24 54 9 85Z"
        fill="url(#mochi-fur)"
        stroke="#6b5568"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <ellipse cx="130" cy="198" rx="40" ry="31" fill="#ffe7f1" />

      <g transform="translate(172 196) rotate(27)">
        <rect x="-10" y="-93" width="20" height="16" rx="5" fill="#ff9fbe" stroke="#6b5568" strokeWidth="3.6" />
        <rect x="-10" y="-80" width="20" height="68" rx="4" fill="url(#mochi-pencil)" stroke="#6b5568" strokeWidth="3.6" />
        <rect x="-10" y="-83" width="20" height="9" rx="3" fill="#a5efd7" stroke="#6b5568" strokeWidth="3.2" />
        <path d="M-10-12 0 12 10-12Z" fill="#f9dcc2" stroke="#6b5568" strokeWidth="3.6" strokeLinejoin="round" />
        <path d="M-3.6-2.8 0 12 3.6-2.8Z" fill="#6b5568" />
      </g>

      <ellipse cx="94" cy="226" rx="25" ry="12" fill="url(#mochi-fur)" stroke="#6b5568" strokeWidth="4" />
      <ellipse cx="166" cy="226" rx="25" ry="12" fill="url(#mochi-fur)" stroke="#6b5568" strokeWidth="4" />
      <path d="M87 222v7M95 221v8M103 223v6M159 223v6M167 221v8M175 222v7" stroke="#cbb5c8" strokeWidth="2.2" strokeLinecap="round" />

      <path
        d="M73 58c-8-24-8-37 1-39 8-2 23 11 34 23Z"
        fill="url(#mochi-fur)"
        stroke="#6b5568"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M79 49c-4-13-4-21 0-22 4-1 12 6 18 13Z" fill="#ffc3d8" />
      <path
        d="M187 58c8-24 8-37-1-39-8-2-23 11-34 23Z"
        fill="url(#mochi-fur)"
        stroke="#6b5568"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M181 49c4-13 4-21 0-22-4-1-12 6-18 13Z" fill="#ffc3d8" />

      <path
        d="M130 40c48 0 74 26 74 57 0 32-30 52-74 52S56 129 56 97c0-31 26-57 74-57Z"
        fill="url(#mochi-fur)"
        stroke="#6b5568"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />

      <g className={styles.eyes}>
        <ellipse cx="103" cy="91" rx="9.5" ry="12.5" fill="#5a4657" />
        <ellipse cx="157" cy="91" rx="9.5" ry="12.5" fill="#5a4657" />
        <circle cx="100" cy="86" r="3.4" fill="#ffffff" />
        <circle cx="154" cy="86" r="3.4" fill="#ffffff" />
        <circle cx="106" cy="96" r="1.7" fill="#ffffff" opacity="0.85" />
        <circle cx="160" cy="96" r="1.7" fill="#ffffff" opacity="0.85" />
      </g>

      <ellipse cx="82" cy="107" rx="11" ry="6" fill="#ff9fbe" opacity="0.6" />
      <ellipse cx="178" cy="107" rx="11" ry="6" fill="#ff9fbe" opacity="0.6" />

      <path d="M125 98c2.2-2.4 7.8-2.4 10 0 0 4-2.4 6.4-5 6.4s-5-2.4-5-6.4Z" fill="#f08ca8" />
      <path d="M120 108c3 4.4 7 4.4 10 0 3 4.4 7 4.4 10 0" fill="none" stroke="#6b5568" strokeWidth="2.8" strokeLinecap="round" />

      <path d="M67 102 45 96M67 110l-24 3M193 102l22-6M193 110l24 3" stroke="#c9b3c6" strokeWidth="2.5" strokeLinecap="round" />

      <g transform="translate(180 56) rotate(14)">
        <ellipse cx="-10" cy="0" rx="10" ry="7" fill="url(#mochi-bow)" stroke="#6b5568" strokeWidth="3.2" transform="rotate(-18 -10 0)" />
        <ellipse cx="10" cy="0" rx="10" ry="7" fill="url(#mochi-bow)" stroke="#6b5568" strokeWidth="3.2" transform="rotate(18 10 0)" />
        <circle cx="0" cy="0" r="4.2" fill="#ffe08a" stroke="#6b5568" strokeWidth="3" />
      </g>
    </svg>
  );
}
