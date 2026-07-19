interface IconProps {
  size?: number;
  className?: string;
}

export function CheckboxIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -6 40 40"
      className={className}
    >
      <g transform="translate(4 -2)">
        <g transform="translate(-4 2)" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="4">
          <rect width="40" height="28" rx="14" stroke="none" />
          <rect x="2" y="2" width="36" height="24" rx="12" fill="none" />
        </g>
        <circle cx="6" cy="6" r="6" transform="translate(4 10)" fill="currentColor" />
      </g>
    </svg>
  );
}
