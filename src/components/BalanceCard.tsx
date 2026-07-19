import Image from "next/image";
import { Landmark } from "lucide-react";
import { formatMoney } from "@/lib/types/database";
import envImg from "@/assets/images/environment-transparent.svg";

interface BalanceCardProps {
  saldo: number;
  comprador?: string | null;
}

export function BalanceCard({ saldo }: BalanceCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-light px-5 py-5 text-white shadow-lg">
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <Landmark size={16} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/70">
            CAJA
          </p>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight">
          {formatMoney(saldo)}
        </p>
        <p className="mt-1 text-xs text-white/60">
          Saldo disponible
        </p>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 opacity-80">
        <Image
          src={envImg}
          alt=""
          width={160}
          height={160}
          className="object-contain"
          aria-hidden
        />
      </div>
    </div>
  );
}