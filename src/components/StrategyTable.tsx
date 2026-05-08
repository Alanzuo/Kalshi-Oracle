// src/components/StrategyTable.tsx — per-strategy comparison table
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Strategy } from "@/lib/types";

// Maker strategies whose backtest PnL is inflated because the fill-rate
// algorithm over-counts by ~3x (validated against PredictionMarketBench
// ground truth on 2026-05-08). Real fill rate is likely 15-25% vs the
// 50-60% we measured. Until Phase 2 (real trade tape) ships, these
// strategies' PnL numbers should be discounted.
const FILL_RATE_UNVERIFIED = new Set([
  "bsm_maker",
  "velocity_maker",
  "wing_fade",
]);

export default function StrategyTable() {
  const [rows, setRows] = useState<Strategy[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("cc_strategies")
        .select("*")
        .order("name");
      if (!cancelled && !error && data) {
        setRows(data as Strategy[]);
        setUpdatedAt(new Date());
      }
    }
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold">Strategies</h2>
        <span className="text-xs text-zinc-500">
          {updatedAt
            ? `Updated ${updatedAt.toLocaleTimeString()}`
            : "Loading..."}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr className="border-b border-zinc-800">
              <Th>Name</Th>
              <Th>Mode</Th>
              <Th align="right">Trades</Th>
              <Th align="right">Open</Th>
              <Th align="right">WR</Th>
              <Th align="right">Today</Th>
              <Th align="right">Realized</Th>
              <Th align="right">ROI</Th>
              <Th align="right">At Risk</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-6 text-zinc-500 text-center"
                >
                  No strategies yet — they&apos;ll appear once the uploader has
                  data.
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr
                key={s.name}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
              >
                <Td>
                  <Link
                    href={`/strategy/${s.name}`}
                    className="font-mono text-zinc-100 hover:text-emerald-400"
                  >
                    {s.name}
                  </Link>
                  {FILL_RATE_UNVERIFIED.has(s.name) && (
                    <span
                      className="ml-2 text-xs uppercase px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-300"
                      title="Maker strategy — backtest PnL is inflated. Real fill rate ~15-25% vs assumed 100%. Awaiting trade-tape integration."
                    >
                      ⚠ unverified
                    </span>
                  )}
                </Td>
                <Td>
                  <span
                    className={`text-xs uppercase px-2 py-0.5 rounded ${
                      s.mode === "live_full"
                        ? "bg-emerald-900/40 text-emerald-300"
                        : s.mode === "live_pilot"
                          ? "bg-blue-900/40 text-blue-300"
                          : s.mode === "paper"
                            ? "bg-zinc-800 text-zinc-400"
                            : "bg-red-900/40 text-red-300"
                    }`}
                  >
                    {s.mode}
                  </span>
                </Td>
                <Td align="right">{s.n_total}</Td>
                <Td align="right">{s.n_open}</Td>
                <Td align="right">
                  {s.wr_pct === null ? "—" : `${s.wr_pct.toFixed(1)}%`}
                </Td>
                <Td align="right" className={pnlClass(s.pnl_today)}>
                  {fmtUsdSigned(s.pnl_today)}
                </Td>
                <Td align="right" className={pnlClass(s.pnl_realized)}>
                  {fmtUsdSigned(s.pnl_realized)}
                </Td>
                <Td align="right" className={pnlClass(s.roi_pct ?? 0)}>
                  {s.roi_pct === null
                    ? "—"
                    : `${s.roi_pct >= 0 ? "+" : ""}${s.roi_pct.toFixed(1)}%`}
                </Td>
                <Td align="right">${s.at_risk_usd.toFixed(2)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-2 ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 tabular-nums ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </td>
  );
}
function fmtUsdSigned(n: number): string {
  return `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;
}
function pnlClass(n: number): string {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-zinc-400";
}
