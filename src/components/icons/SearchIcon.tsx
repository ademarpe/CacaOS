interface IconProps {
  size?: number;
  className?: string;
}

export function SearchIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
    >
      <path
        d="M12,4a7.988,7.988,0,0,1,6.517,12.624L17.73,17.73l-1.106.787A8,8,0,1,1,12,4m0-4a12,12,0,1,0,6.943,21.776l9.637,9.637a2,2,0,0,0,2.833-2.833l-9.637-9.637A11.988,11.988,0,0,0,12,0Z"
        fill="currentColor"
      />
    </svg>
  );
}
