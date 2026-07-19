import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Icon } from "./Icon";

interface NavButtonProps {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}

export function NavButton({ href, label, icon, primary }: NavButtonProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
        primary
          ? "bg-surface text-accent shadow-md hover:shadow-lg active:scale-95 border border-accent/20"
          : "border border-border bg-surface text-foreground hover:shadow-md active:scale-95"
      }`}
    >
      <Icon icon={icon} size={28} />
      {label}
    </Link>
  );
}
