// src/components/ModelMetricsTable.tsx — BSM (baseline) vs ML side-by-side
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ModelVersion } from "@/lib/types";

type Direction = "lower" | "higher";

interface Metric {
  label: string;
  hint: string;
  baseline: number | null;
  ml: number | null;
  // "lower" means lower-is-better; "higher" means higher-is-better
  direction: Direction;
  // Formatter for raw values
  fmt: (n: number) => string;
  // Optional override for delta formatting (e.g., dollars vs %)
  deltaFmt?: (delta: number, baseline: number, ml: number) => string;
}

export default function ModelMetricsTable() {
  const [model, setModel] = useState<ModelVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("cc_model_versions")
        .select("*")
        .eq("is_active", true)
        .order("trained_at_utc", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        if (!error && data) setModel(data as ModelVersion);
        else setModel(null);
        setLoading(false);
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
      <div className="px-6 py-3 border-b border-zinc-800">
        <h2 className="font-semibold">BSM vs ML — Test-set metrics</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Baseline is Black–Scholes (BSM) fair-prob. ML is the trained
          classifier scored on the same held-out test split.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-2 text-left">Metric</th>
              <th className="px-4 py-2 text-right">BSM (baseline)</th>
              <th className="px-4 py-2 text-right">LogReg (ML)</th>
              <th className="px-4 py-2 text-right">Δ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-zinc-500 text-center"
                >
                  Loading metrics...
                </td>
              </tr>
            )}
            {!loading && !model && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-zinc-500 text-center"
                >
                  No active model in <code>cc_model_versions</code>.
                </td>
              </tr>
            )}
            {!loading &&
              model &&
              buildMetrics(model).map((m) => (
                <MetricRow key={m.label} m={m} />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildMetrics(m: ModelVersion): Metric[] {
  return [
    {
      label: "Brier",
      hint: "lower is better",
      baseline: m.baseline_brier,
      ml: m.test_brier,
      direction: "lower",
      fmt: (n) => n.toFixed(4),
      deltaFmt: pctDelta,
    },
    {
      label: "Log loss",
      hint: "lower is better",
      baseline: m.baseline_log_loss,
      ml: m.test_log_loss,
      direction: "lower",
      fmt: (n) => n.toFixed(4),
      deltaFmt: pctDelta,
    },
    {
      label: "Calibration MAE",
      hint: "lower is better",
      baseline: m.baseline_calibration_mae,
      ml: m.test_calibration_mae,
      direction: "lower",
      // Stored as fraction; display as percentage points
      fmt: (n) => `${(n * 100).toFixed(2)}pp`,
      deltaFmt: pctDelta,
    },
    {
      label: "PnL @ ≥25 edge",
      hint: "higher is better",
      baseline: m.baseline_pnl_at_25edge,
      ml: m.test_pnl_at_25edge,
      direction: "higher",
      fmt: (n) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`,
      deltaFmt: usdDelta,
    },
  ];
}

function MetricRow({ m }: { m: Metric }) {
  const hasBoth = m.baseline !== null && m.ml !== null;
  const better = hasBoth
    ? m.direction === "lower"
      ? (m.ml as number) < (m.baseline as number)
      : (m.ml as number) > (m.baseline as number)
    : null;

  const deltaClass =
    better === null
      ? "text-zinc-400"
      : better
        ? "text-emerald-400"
        : "text-red-400";

  let deltaText = "—";
  if (hasBoth) {
    const delta = (m.ml as number) - (m.baseline as number);
    deltaText = m.deltaFmt
      ? m.deltaFmt(delta, m.baseline as number, m.ml as number)
      : delta.toFixed(4);
  }

  return (
    <tr className="border-b border-zinc-800/50">
      <td className="px-4 py-3">
        <div className="text-zinc-200">{m.label}</div>
        <div className="text-xs text-zinc-500">{m.hint}</div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
        {m.baseline === null ? "—" : m.fmt(m.baseline)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-100 font-medium">
        {m.ml === null ? "—" : m.fmt(m.ml)}
      </td>
      <td
        className={`px-4 py-3 text-right tabular-nums ${deltaClass}`}
      >
        {deltaText}
      </td>
    </tr>
  );
}

function pctDelta(_delta: number, baseline: number, ml: number): string {
  if (baseline === 0) return "—";
  const pct = ((ml - baseline) / Math.abs(baseline)) * 100;
  const sign = pct >= 0 ? "+" : "−";
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

function usdDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : "−";
  return `${sign}$${Math.abs(delta).toFixed(2)}`;
}
