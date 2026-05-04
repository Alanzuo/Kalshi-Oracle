// src/components/EquityCurves.tsx — overlay of cumulative PnL curves per strategy
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { EquityPoint } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface ChartRow {
  bucket_utc: string;
  [strategyName: string]: string | number;
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
];

export default function EquityCurves() {
  const [points, setPoints] = useState<EquityPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("cc_equity_points")
        .select("*")
        .order("bucket_utc", { ascending: true });
      if (!cancelled && !error && data) setPoints(data as EquityPoint[]);
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Pivot {strategy_name, bucket_utc, cumulative_pnl} into per-bucket rows.
  const buckets = Array.from(new Set(points.map((p) => p.bucket_utc))).sort();
  const strategies = Array.from(
    new Set(points.map((p) => p.strategy_name)),
  ).sort();
  const byKey = new Map<string, EquityPoint>();
  for (const p of points) byKey.set(`${p.strategy_name}|${p.bucket_utc}`, p);

  const chartData: ChartRow[] = [];
  const lastByStrategy: Record<string, number> = {};
  for (const b of buckets) {
    const row: ChartRow = { bucket_utc: b };
    for (const s of strategies) {
      const p = byKey.get(`${s}|${b}`);
      if (p) {
        row[s] = p.cumulative_pnl;
        lastByStrategy[s] = p.cumulative_pnl;
      } else if (s in lastByStrategy) {
        row[s] = lastByStrategy[s];
      } else {
        row[s] = 0;
      }
    }
    chartData.push(row);
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="font-semibold mb-4">Cumulative P&L (last 14 days)</h2>
      {chartData.length === 0 ? (
        <div className="text-zinc-500 text-sm py-12 text-center">
          No settled trades yet — curves appear after the first WON/LOST
          resolution.
        </div>
      ) : (
        <div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="bucket_utc"
                stroke="#71717a"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                stroke="#71717a"
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                }}
                labelFormatter={(v) => new Date(v as string).toLocaleString()}
                formatter={(v) => `$${(v as number).toFixed(2)}`}
              />
              <Legend />
              {strategies.map((s, i) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
