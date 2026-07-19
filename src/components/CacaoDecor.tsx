interface CacaoDecorProps {
  className?: string;
  size?: number;
}

export function CacaoDecor({ className = "", size = 140 }: CacaoDecorProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      width={size}
      height={size}
      fill="none"
    >
      <ellipse cx="100" cy="95" rx="48" ry="38" fill="currentColor" />
      <ellipse cx="100" cy="95" rx="32" ry="24" fill="currentColor" opacity={0.3} />
      <circle cx="82" cy="80" r="8" fill="currentColor" opacity={0.2} />
      <circle cx="118" cy="80" r="7" fill="currentColor" opacity={0.2} />
      <circle cx="100" cy="113" r="7" fill="currentColor" opacity={0.2} />
      <circle cx="92" cy="96" r="4" fill="currentColor" opacity={0.15} />
      <circle cx="108" cy="96" r="4" fill="currentColor" opacity={0.15} />
      <circle cx="100" cy="85" r="4" fill="currentColor" opacity={0.15} />
    </svg>
  );
}