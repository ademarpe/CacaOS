interface IconProps {
  size?: number;
  className?: string;
}

export function CheckIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 273 273"
      fill="none"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 136.5C0 61.1131 61.1131 0 136.5 0C211.886 0 273 61.1131 273 136.5C273 211.886 211.886 273 136.5 273C61.1131 273 0 211.886 0 136.5ZM187.102 99.548C192.432 104.879 192.432 113.522 187.102 118.852L136.832 169.122C129.11 176.844 116.59 176.844 108.868 169.122L85.8979 146.152C80.5674 140.822 80.5674 132.178 85.8979 126.848C91.2287 121.518 99.8713 121.518 105.202 126.848L122.85 144.496L167.798 99.548C173.128 94.2174 181.772 94.2174 187.102 99.548Z"
        fill="currentColor"
      />
    </svg>
  );
}
