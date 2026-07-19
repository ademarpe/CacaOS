interface IconProps {
  size?: number;
  className?: string;
}

export function BackIcon({ size = 28, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#ffffff" />
      <path
        d="M17.387,20.587,14.754,18H22.02A1.979,1.979,0,0,0,24,16.02v-.04A1.979,1.979,0,0,0,22.02,14H15.057l.042-.26,2.227-2.248a2.091,2.091,0,0,0,.293-2.657A1.973,1.973,0,0,0,14.6,8.58L8.581,14.654a2.017,2.017,0,0,0,0,2.833l6,5.934a1.97,1.97,0,0,0,2.806,0A2.016,2.016,0,0,0,17.387,20.587Z"
        fill="#000000"
      />
    </svg>
  );
}
