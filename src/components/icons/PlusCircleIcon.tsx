interface IconProps {
  size?: number;
  className?: string;
}

export function PlusCircleIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
    >
      <g>
        <path
          d="M16,0A16,16,0,1,0,32,16,16,16,0,0,0,16,0Zm0,28A12,12,0,1,1,28,16,12.013,12.013,0,0,1,16,28Z"
          fill="currentColor"
        />
        <path
          d="M22.02,14H18V9.98A1.979,1.979,0,0,0,16.02,8h-.04A1.979,1.979,0,0,0,14,9.98V14H9.98A1.979,1.979,0,0,0,8,15.98v.04A1.979,1.979,0,0,0,9.98,18H14v4.02A1.979,1.979,0,0,0,15.98,24h.04A1.979,1.979,0,0,0,18,22.02V18h4.02A1.979,1.979,0,0,0,24,16.02v-.04A1.979,1.979,0,0,0,22.02,14Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
