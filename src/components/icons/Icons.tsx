import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20l4.2-1 9.6-9.6a2.4 2.4 0 0 0 0-3.4l-1.8-1.8a2.4 2.4 0 0 0-3.4 0L3 14.8 2 19l2 1Z" />
      <path d="m13.4 5.4 5.2 5.2" />
      <path d="m4 20 1-4.2" />
    </IconBase>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3a9 9 0 1 0 0 18h1.4a1.9 1.9 0 0 0 1.5-3.1 1.9 1.9 0 0 1 1.4-3.1H18a3.4 3.4 0 0 0 3.4-3.4C21.4 6.5 17.2 3 12 3Z" />
      <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="6.6" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function StarIcon({ filled = true, ...props }: IconProps & { filled?: boolean }) {
  return (
    <IconBase {...props} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 2.9l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.5l6.2-.9L12 2.9Z" />
    </IconBase>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 11h16v9.2H4V11Z" />
      <path d="M3 7.6h18V11H3V7.6Z" />
      <path d="M12 7.6v12.6" />
      <path d="M12 7.4c-1.4-3.4-3-4.8-4.6-4.4C5.7 3.5 5.5 5.6 7 6.6c1 .6 2.7.8 5 .8Z" />
      <path d="M12 7.4c1.4-3.4 3-4.8 4.6-4.4 1.7.5 1.9 2.6.4 3.6-1 .6-2.7.8-5 .8Z" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 9h10.2a5.8 5.8 0 0 1 0 11.6H8.4" />
      <path d="m8.4 4.6L4 9l4.4 4.4" />
    </IconBase>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 6.5h15" />
      <path d="M9 6.5V4.2h6v2.3" />
      <path d="m6.5 6.5.9 13.2h9.2l.9-13.2" />
      <path d="M10 10.5v5.4M14 10.5v5.4" />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4.5" y="10" width="15" height="10.5" rx="3" />
      <path d="M8 10V7.6a4 4 0 0 1 8 0V10" />
      <path d="M12 14.2v2.4" />
    </IconBase>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.2 18.5h9.6a4 4 0 0 0 .5-8 5.6 5.6 0 0 0-10.7-1.2A4.7 4.7 0 0 0 7.2 18.5Z" />
    </IconBase>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 9.6h3.1L12 5.5v13L7.1 14.4H4V9.6Z" />
      <path d="M15.6 9.2a4 4 0 0 1 0 5.6" />
      <path d="M18.3 6.5a7.7 7.7 0 0 1 0 11" />
    </IconBase>
  );
}

export function VolumeOffIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 9.6h3.1L12 5.5v13L7.1 14.4H4V9.6Z" />
      <path d="m16.2 9.7 4.6 4.6" />
      <path d="m20.8 9.7-4.6 4.6" />
    </IconBase>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.2c.7 4.4 2.4 6.1 6.8 6.8-4.4.7-6.1 2.4-6.8 6.8-.7-4.4-2.4-6.1-6.8-6.8 4.4-.7 6.1-2.4 6.8-6.8Z" />
      <path d="M18.6 15.8c.3 1.9 1 2.6 2.9 2.9-1.9.3-2.6 1-2.9 2.9-.3-1.9-1-2.6-2.9-2.9 1.9-.3 2.6-1 2.9-2.9Z" />
    </IconBase>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 10.4 12 3.6l8 6.8v9.2H4v-9.2Z" />
      <path d="M9.2 19.6v-5.8h5.6v5.8" />
    </IconBase>
  );
}

export function BucketIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.2 10.8 12.8 4.2l6.4 6.4-5.3 5.3a2.4 2.4 0 0 1-3.4 0l-4.3-4.3a1.3 1.3 0 0 1 0-1.8Z" />
      <path d="m8.9 8.1 6.4 6.4" />
      <path d="M19.6 14.4c.9 1.3 1.4 2.3 1.4 3a1.4 1.4 0 0 1-2.8 0c0-.7.5-1.7 1.4-3Z" />
    </IconBase>
  );
}

export function StickerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.4l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.6-5 2.6 1-5.6-4.1-4 5.6-.8L12 3.4Z" />
      <circle cx="9.9" cy="10.7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.1" cy="10.7" r="0.9" fill="currentColor" stroke="none" />
      <path d="M9.9 13.1c1.2 1 3 1 4.2 0" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
    </IconBase>
  );
}
