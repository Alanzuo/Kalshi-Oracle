// src/components/StrategyDetail.tsx — per-strategy drilldown
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Strategy, Trade } from "@/lib/types";

interface Props {
  name: string;
}

export default function StrategyDetail({ name }: Props) {
  const [meta, setMeta] = useState<Strategy | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data: m }, { data: t }] = await Promise.all([
        supabase.from("cc_strategies").select("*").eq("name", name).maybeSingle(),
        supabase
          .from("cc_trades_recent")
          .select("*")
          .eq("source", "strategy")
          .eq("strategy_name", name)
          .order("opened_at_utc", { ascending: false })
          .limit(200),
      ]);
      if (cancelled) return;
      if (m) setMeta(m as Strategy);
      if (t) setTrades(t as Trade[]);
    }
    load();
    const i = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [name]);

  if (!meta) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-zinc-400">
        Loading {name}...
      </div>
    );
  }

  // Compute distribution of entry prices
  const entryBuckets: Record<string, number> = {};
  for (const t of trades) {
    const c = Math.floor(t.entry_price_cents / 10) * 10;
    const k = `${c}-${c + 9}¢`;
    entryBuckets[k] = (entryBuckets[k] || 0) + 1;
  }
  const sortedBuckets = Object.entries(entryBuckets).sort(
    (a, b) => parseInt(a[0]) - parseInt(b[0]),
  );

  // Compute sigma stats
  const sigmas = trades
    .map((t) => t.realized_sigma_10m)
    .filter((s): s is number => s !== null);
  const avgSigma =
    sigmas.length > 0
      ? sigmas.reduce((a, b) => a + b, 0) / sigmas.length
      : null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-mono">{meta.name}</h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
              {meta.description ?? "—"}
            </p>
          </div>
          <span
            className={`text-xs uppercase px-3 py-1 rounded ${
              meta.mode === "paper"
                ? "bg-zinc-800 text-zinc-400"
                : "bg-emerald-900/40 text-emerald-300"
            }`}
          >
            {meta.mode}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <Stat label="Trades" value={String(meta.n_total)} />
          <Stat label="Open" value={String(meta.n_open)} />
          <Stat
            label="WR"
            value={meta.wr_pct === null ? "—" : `${meta.wr_pct.toFixed(1)}%`}
          />
          <Stat
            label="Today"
            value={fmt(meta.pnl_today)}
            cls={pnlCls(meta.pnl_today)}
          />
          <Stat
            label="Realized"
            value={fmt(meta.pnl_realized)}
            cls={pnlCls(meta.pnl_realized)}
          />
          <Stat
            label="At Risk"
            value={`$${meta.at_risk_usd.toFixed(2)}`}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-semibold mb-3">Entry-price distribution</h3>
          {sortedBuckets.length === 0 ? (
            <div className="text-zinc-500 text-sm">No trades yet.</div>
          ) : (
            <div className="space-y-1.5">
              {sortedBuckets.map(([k, n]) => {
                const pct = (100 * n) / trades.length;
                return (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-zinc-500 font-mono">{k}</span>
                    <div className="flex-1 h-3 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-emerald-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-zinc-400 tabular-nums">
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-semibold mb-3">Sigma at entry (10m bps/min)</h3>
          {avgSigma === null ? (
            <div className="text-zinc-500 text-sm">No sigma data yet.</div>
          ) : (
            <>
              <div className="text-3xl font-semibold tabular-nums">
                {avgSigma.toFixed(2)}
                <span className="text-sm text-zinc-500 ml-2">avg bps/min</span>
              </div>
              <div className="text-xs text-zinc-500 mt-2">
                Min: {Math.min(...sigmas).toFixed(2)} • Max:{" "}
                {Math.max(...sigmas).toFixed(2)} • n={sigmas.length}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="px-6 py-3 border-b border-zinc-800">
          <h3 className="font-semibold">Recent trades — last 200</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-zinc-500 uppercase">
              <tr className="border-b border-zinc-800">
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Asset</th>
                <th className="px-3 py-2 text-left">Side</th>
                <th className="px-3 py-2 text-right">Entry</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2 text-right">Sigma</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-6 text-zinc-500 text-center"
                  >
                    No trades yet for this strategy.
                  </td>
                </tr>
              )}
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-zinc-800/50">
                  <td className="px-3 py-2 text-zinc-400 font-mono">
                    {new Date(t.opened_at_utc).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{t.underlying ?? "—"}</td>
                  <td
                    className={`px-3 py-2 font-mono ${
                      t.side === "YES" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {t.side}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {t.entry_price_cents.toFixed(0)}¢
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${t.entry_cost_usd.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                    {t.realized_sigma_10m === null
                      ? "—"
                      : t.realized_sigma_10m.toFixed(1)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        t.status === "WON"
                          ? "text-emerald-400"
                          : t.status === "LOST"
                            ? "text-red-400"
                            : t.status === "OPEN"
                              ? "text-blue-400"
                              : "text-zinc-500"
                      }
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
                    {t.pnl === null ? "—" : `${t.pnl >= 0 ? "+" : "−"}$${Math.abs(t.pnl).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  cls = "",
}: {
  label: string;
  value: string;
  cls?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className={`text-lg font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function fmt(n: number): string {
  return `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;
}

function pnlCls(n: number): string {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-zinc-300";
}
