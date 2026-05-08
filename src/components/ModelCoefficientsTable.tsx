// src/components/ModelCoefficientsTable.tsx — top-N features for active model
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ModelCoefficient, ModelVersion } from "@/lib/types";

const TOP_N = 10;

export default function ModelCoefficientsTable() {
  const [rows, setRows] = useState<ModelCoefficient[]>([]);
  const [loading, setLoading] = useState(true);
  const [versionTag, setVersionTag] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: active } = await supabase
        .from("cc_model_versions")
        .select("version_tag")
        .eq("is_active", true)
        .order("trained_at_utc", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) {
        if (!cancelled) {
          setRows([]);
          setVersionTag(null);
          setLoading(false);
        }
        return;
      }
      const tag = (active as Pick<ModelVersion, "version_tag">).version_tag;
      const { data, error } = await supabase
        .from("cc_model_coefficients")
        .select("*")
        .eq("version_tag", tag)
        .order("abs_coefficient", { ascending: false })
        .limit(TOP_N);
      if (!cancelled) {
        if (!error && data) setRows(data as ModelCoefficient[]);
        else setRows([]);
        setVersionTag(tag);
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

  const maxAbs = rows.reduce((m, r) => Math.max(m, r.abs_coefficient), 0);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-6 py-3 border-b border-zinc-800">
        <h2 className="font-semibold">Top {TOP_N} Features</h2>
        <p className="text-xs text-zinc-500 mt-1">
          {versionTag ? (
            <>
              Sorted by |coefficient| for{" "}
              <span className="font-mono text-zinc-400">{versionTag}</span>.
              Sign indicates direction; magnitude indicates pull on the
              probability score.
            </>
          ) : (
            "No active model."
          )}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-2 text-left">Feature</th>
              <th className="px-4 py-2 text-right">Coefficient</th>
              <th className="px-4 py-2 text-right">|abs|</th>
              <th className="px-4 py-2 text-left w-1/3">Magnitude</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-zinc-500 text-center"
                >
                  Loading coefficients...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-zinc-500 text-center"
                >
                  No coefficients found for active model.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const pct = maxAbs > 0 ? (r.abs_coefficient / maxAbs) * 100 : 0;
              const positive = r.coefficient >= 0;
              const barColor = positive ? "bg-emerald-500/60" : "bg-red-500/60";
              const coefColor = positive
                ? "text-emerald-400"
                : "text-red-400";
              return (
                <tr
                  key={r.feature_name}
                  className="border-b border-zinc-800/50"
                >
                  <td className="px-4 py-3 font-mono text-zinc-200 text-xs">
                    {r.feature_name}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${coefColor}`}
                  >
                    {fmtSigned(r.coefficient)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-400">
                    {r.abs_coefficient.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-full bg-zinc-800/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor}`}
                        style={{ width: `${pct.toFixed(1)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmtSigned(n: number): string {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${Math.abs(n).toFixed(4)}`;
}
