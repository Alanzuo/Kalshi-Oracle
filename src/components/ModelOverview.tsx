// src/components/ModelOverview.tsx — hero card for the active ML model
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ModelVersion } from "@/lib/types";

export default function ModelOverview() {
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
        if (!error && data) {
          setModel(data as ModelVersion);
        } else {
          setModel(null);
        }
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

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-zinc-500">
        Loading active model...
      </div>
    );
  }

  if (!model) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-zinc-300 font-medium">No active model</div>
        <div className="text-xs text-zinc-500 mt-1">
          No row in <code className="text-zinc-400">cc_model_versions</code>{" "}
          has <code className="text-zinc-400">is_active = true</code>. Train a
          model and mark it active.
        </div>
      </div>
    );
  }

  const decisionShip = (model.decision || "").toLowerCase() === "ship";
  const decisionBadge = decisionShip
    ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
    : "bg-red-950/60 text-red-300 border-red-800";

  const mlPnl = model.test_pnl_at_25edge;
  const bsmPnl = model.baseline_pnl_at_25edge;
  const pnlDelta =
    mlPnl !== null && bsmPnl !== null ? mlPnl - bsmPnl : null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            Active Model
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-xl text-zinc-100">
              {model.version_tag}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${decisionBadge}`}
            >
              {decisionShip ? "SHIP" : "SHELVE"}
            </span>
          </div>
          {model.notes && (
            <div className="text-xs text-zinc-500 mt-2 max-w-2xl">
              {model.notes}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            ML PnL @ ≥25 edge
          </div>
          <div
            className={`text-2xl font-semibold tabular-nums ${pnlColor(
              mlPnl
            )}`}
          >
            {fmtUsdOrDash(mlPnl)}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            BSM: {fmtUsdOrDash(bsmPnl)}
            {pnlDelta !== null && (
              <span className={`ml-2 ${pnlColor(pnlDelta)}`}>
                ({pnlDelta >= 0 ? "+" : "−"}$
                {Math.abs(pnlDelta).toFixed(2)})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Model type" value={model.model_type} />
        <Stat
          label="Trained at"
          value={new Date(model.trained_at_utc).toLocaleString()}
        />
        <Stat
          label="Train rows"
          value={model.n_train_rows.toLocaleString()}
        />
        <Stat
          label="Test rows"
          value={model.n_test_rows.toLocaleString()}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="text-sm font-medium text-zinc-200 tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  );
}

function fmtUsdOrDash(n: number | null): string {
  if (n === null || n === undefined) return "—";
  const s = n >= 0 ? "+" : "−";
  return `${s}$${Math.abs(n).toFixed(2)}`;
}

function pnlColor(n: number | null): string {
  if (n === null || n === undefined) return "text-zinc-300";
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-zinc-300";
}
