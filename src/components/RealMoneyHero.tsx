// src/components/RealMoneyHero.tsx — top-of-page real-money summary card
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RealMoney } from "@/lib/types";

export default function RealMoneyHero() {
  const [data, setData] = useState<RealMoney | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("cc_real_money")
        .select("*")
        .eq("id", 1)
        .single();
      if (!cancelled && !error) setData(data as RealMoney);
    }
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (!data) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
        Loading real-money status...
      </div>
    );
  }

  const breakerColor = data.kill_file_active
    ? "text-red-400"
    : data.last_breaker_4h_pnl !== null && data.last_breaker_4h_pnl < -10
      ? "text-yellow-400"
      : "text-emerald-400";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
      <Stat
        label="Lifetime P&L"
        value={fmtUsd(data.lifetime_pnl)}
        sub={`${data.lifetime_n} trades`}
        valueClass={pnlColor(data.lifetime_pnl)}
      />
      <Stat
        label="Today"
        value={fmtUsd(data.today_pnl)}
        sub={`${data.today_n} settled`}
        valueClass={pnlColor(data.today_pnl)}
      />
      <Stat
        label="Open"
        value={String(data.open_n)}
        sub={`$${data.open_at_risk_usd.toFixed(2)} at risk`}
      />
      <Stat
        label="4h P&L"
        value={
          data.last_breaker_4h_pnl !== null
            ? fmtUsd(data.last_breaker_4h_pnl)
            : "—"
        }
        sub="breaker = −$15"
        valueClass={breakerColor}
      />
      <Stat
        label="Status"
        value={data.kill_file_active ? "PAUSED" : "LIVE"}
        sub={data.kill_file_active ? "kill file present" : "trading"}
        valueClass={
          data.kill_file_active ? "text-red-400" : "text-emerald-400"
        }
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  valueClass = "",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${valueClass}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function fmtUsd(n: number): string {
  const s = n >= 0 ? "+" : "−";
  return `${s}$${Math.abs(n).toFixed(2)}`;
}

function pnlColor(n: number): string {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-zinc-300";
}
