// src/components/BacktestTable.tsx — most recent backtest run, ranked by Sharpe
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface BacktestRow {
  run_id: string;
  strategy_name: string;
  window_start_utc: string;
  window_end_utc: string;
  n_signals_seen: number;
  n_fired: number;
  n_won: number;
  n_lost: number;
  wr_pct: number | null;
  pnl: number;
  roi_pct: number | null;
  avg_entry_cents: number | null;
  max_drawdown_usd: number | null;
  sharpe: number | null;
  created_at: string;
}

export default function BacktestTable() {
  const [rows, setRows] = useState<BacktestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: latestRun } = await supabase
        .from("cc_backtest_runs")
        .select("run_id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latestRun) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("cc_backtest_runs")
        .select("*")
        .eq("run_id", latestRun.run_id)
        .order("sharpe", { ascending: false });
      if (!cancelled && !error && data) {
        setRows(data as BacktestRow[]);
        setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-6 py-3 border-b border-zinc-800">
        <h2 className="font-semibold">Most-Recent Backtest</h2>
        {rows.length > 0 && (
          <p className="text-xs text-zinc-500 mt-1">
            Window:{" "}
            {new Date(rows[0].window_start_utc).toLocaleDateString()} →{" "}
            {new Date(rows[0].window_end_utc).toLocaleDateString()} • signals
            seen: {rows[0].n_signals_seen}
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-2 text-left">Strategy</th>
              <th className="px-4 py-2 text-right">Fired</th>
              <th className="px-4 py-2 text-right">WR</th>
              <th className="px-4 py-2 text-right">PnL</th>
              <th className="px-4 py-2 text-right">ROI</th>
              <th className="px-4 py-2 text-right">Avg ¢</th>
              <th className="px-4 py-2 text-right">Max DD</th>
              <th className="px-4 py-2 text-right">Sharpe</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-6 text-zinc-500 text-center"
                >
                  Loading backtest...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-6 text-zinc-500 text-center"
                >
                  No backtest results yet. Run{" "}
                  <code className="text-zinc-300">
                    python3 scripts/backtest_strategies.py
                  </code>{" "}
                  on the Mac to populate.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr
                key={r.strategy_name}
                className={`border-b border-zinc-800/50 ${
                  i === 0 ? "bg-emerald-950/20" : ""
                }`}
              >
                <td className="px-4 py-3 font-mono">
                  {i === 0 && (
                    <span className="mr-2 text-emerald-400">★</span>
                  )}
                  {r.strategy_name}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.n_fired}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.wr_pct === null ? "—" : `${r.wr_pct.toFixed(1)}%`}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    r.pnl > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {`${r.pnl >= 0 ? "+" : "−"}$${Math.abs(r.pnl).toFixed(2)}`}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    (r.roi_pct ?? 0) > 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {r.roi_pct === null
                    ? "—"
                    : `${r.roi_pct >= 0 ? "+" : ""}${r.roi_pct.toFixed(1)}%`}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-400">
                  {r.avg_entry_cents === null
                    ? "—"
                    : r.avg_entry_cents.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-400">
                  {r.max_drawdown_usd === null
                    ? "—"
                    : `$${r.max_drawdown_usd.toFixed(2)}`}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.sharpe === null ? "—" : r.sharpe.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
