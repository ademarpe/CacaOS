import { type LucideIcon } from "lucide-react";

interface IconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function Icon({
  icon: LucideIconComponent,
  className = "",
  size = 20,
  strokeWidth = 2,
}: IconProps) {
  return (
    <LucideIconComponent
      className={className}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
