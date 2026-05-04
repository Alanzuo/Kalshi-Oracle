// src/components/LiveTape.tsx — last 100 trades across all strategies + real
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Trade } from "@/lib/types";

export default function LiveTape() {
  const [rows, setRows] = useState<Trade[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("cc_trades_recent")
        .select("*")
        .order("opened_at_utc", { ascending: false })
        .limit(100);
      if (!cancelled && !error && data) setRows(data as Trade[]);
    }
    load();
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-6 py-3 border-b border-zinc-800">
        <h2 className="font-semibold">Live Tape — last 100</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-zinc-500 uppercase">
            <tr className="border-b border-zinc-800">
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Asset</th>
              <th className="px-3 py-2 text-left">Side</th>
              <th className="px-3 py-2 text-right">Strike</th>
              <th className="px-3 py-2 text-right">Entry</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">P&L</th>
              <th className="px-3 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-8 text-zinc-500 text-center"
                >
                  No trades yet.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr
                key={t.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/40"
              >
                <td className="px-3 py-2 text-zinc-400 font-mono">
                  {new Date(t.opened_at_utc).toLocaleTimeString()}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      t.source === "real"
                        ? "bg-emerald-900/40 text-emerald-300"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {t.source === "real" ? "REAL" : (t.strategy_name ?? "paper")}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-300">
                  {t.underlying ?? "—"}
                </td>
                <td
                  className={`px-3 py-2 font-mono ${
                    t.side === "YES" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {t.side}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {t.strike !== null ? t.strike.toFixed(2) : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {t.entry_price_cents.toFixed(0)}¢
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ${t.entry_cost_usd.toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`text-xs ${
                      t.status === "WON"
                        ? "text-emerald-400"
                        : t.status === "LOST"
                          ? "text-red-400"
                          : t.status === "OPEN"
                            ? "text-blue-400"
                            : "text-zinc-500"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    t.pnl !== null && t.pnl > 0
                      ? "text-emerald-400"
                      : t.pnl !== null && t.pnl < 0
                        ? "text-red-400"
                        : "text-zinc-500"
                  }`}
                >
                  {t.pnl === null
                    ? "—"
                    : `${t.pnl >= 0 ? "+" : "−"}$${Math.abs(t.pnl).toFixed(2)}`}
                </td>
                <td className="px-3 py-2 text-zinc-500 truncate max-w-xs">
                  {t.notes ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
