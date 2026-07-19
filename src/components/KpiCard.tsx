import { type LucideIcon } from "lucide-react";
import { Icon } from "./Icon";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  color?: "accent" | "cacao" | "cacao-light" | "cacao-dark" | "warning" | "danger";
}

export function KpiCard({ label, value, icon, color = "accent" }: KpiCardProps) {
  const borderMap: Record<string, string> = {
    accent: "border-l-accent",
    cacao: "border-l-cacao",
    "cacao-light": "border-l-cacao-light",
    "cacao-dark": "border-l-cacao-dark",
    warning: "border-l-warning",
    danger: "border-l-danger",
  };

  return (
    <div
      className={`rounded-xl border border-border bg-surface px-4 py-4 border-l-4 ${borderMap[color] ?? borderMap.accent} shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </p>
        {icon && (
          <div className="rounded-lg bg-cacao/5 p-1.5">
            <Icon icon={icon} size={18} className="text-cacao" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-cacao-dark">{value}</p>
    </div>
  );
}
