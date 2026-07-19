interface IconProps {
  size?: number;
  className?: string;
}

export function CloseCircleIcon({ size = 24, className = "" }: IconProps) {
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
          d="M21.443,10.584l-.027-.027a1.9,1.9,0,0,0-2.688,0L16,13.285l-2.728-2.728a1.9,1.9,0,0,0-2.688,0l-.027.027a1.9,1.9,0,0,0,0,2.688L13.285,16l-2.728,2.728a1.9,1.9,0,0,0,0,2.688l.027.027a1.9,1.9,0,0,0,2.688,0L16,18.715l2.728,2.728a1.9,1.9,0,0,0,2.688,0l.027-.027a1.9,1.9,0,0,0,0-2.688L18.715,16l2.728-2.728A1.9,1.9,0,0,0,21.443,10.584Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
