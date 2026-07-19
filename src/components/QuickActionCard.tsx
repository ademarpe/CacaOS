import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Icon } from "./Icon";

interface QuickActionCardProps {
  href: string;
  label: string;
  desc: string;
  color: "accent" | "warning" | "cacao" | "surface";
  icon: LucideIcon;
  image?: StaticImageData;
  imageClassName?: string;
}

const bgMap: Record<string, string> = {
  accent: "bg-accent text-white",
  warning: "bg-warning text-white",
  cacao: "bg-cacao text-white",
  surface: "bg-surface text-foreground border border-border",
};

export function QuickActionCard({
  href,
  label,
  desc,
  color,
  icon,
  image,
  imageClassName = "bottom-0 right-0 opacity-50",
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl px-4 py-4 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97] ${bgMap[color]}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            color === "surface"
              ? "bg-cacao/10 text-cacao"
              : "bg-white/20 text-white"
          }`}
        >
          <Icon icon={icon} size={20} />
        </div>
        <ChevronRight
          size={18}
          className={`shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
            color === "surface" ? "text-muted" : "text-white/60"
          }`}
        />
      </div>
      <div className="mt-3">
        <p className="text-sm font-semibold">{label}</p>
        <p
          className={`text-xs ${
            color === "surface" ? "text-muted" : "text-white/70"
          }`}
        >
          {desc}
        </p>
      </div>
      {image && (
        <div className={`pointer-events-none absolute ${imageClassName}`}>
          <Image
            src={image}
            alt=""
            width={120}
            height={120}
            className="object-contain"
            aria-hidden
          />
        </div>
      )}
    </Link>
  );
}
