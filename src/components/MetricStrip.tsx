import { type LucideIcon } from "lucide-react";
import { Icon } from "./Icon";

interface MetricItem {
  label: string;
  value: string;
  icon: LucideIcon;
  color: "green" | "brown";
  comparison: string;
}

interface MetricStripProps {
  items: MetricItem[];
}

const iconBgMap: Record<string, string> = {
  green: "bg-accent/10",
  brown: "bg-cacao/10",
};

const iconTextMap: Record<string, string> = {
  green: "text-accent",
  brown: "text-cacao",
};

const compColorMap: Record<string, string> = {
  green: "text-accent",
  brown: "text-cacao",
};

export function MetricStrip({ items }: MetricStripProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Resumen del día
        </p>
        <div className="flex-1 border-t border-border" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1 text-center"
          >
            <div className={`rounded-lg p-1.5 ${iconBgMap[item.color]}`}>
              <Icon icon={item.icon} size={16} className={iconTextMap[item.color]} />
            </div>
            <p className="text-xs font-semibold text-cacao-dark leading-tight">
              {item.value}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted">
              {item.label}
            </p>
            <p className={`text-[10px] font-medium ${compColorMap[item.color]}`}>
              {item.comparison}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}