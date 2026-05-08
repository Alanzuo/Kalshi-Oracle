// src/app/model/page.tsx — ML probability model overview & comparison vs BSM
import ModelOverview from "@/components/ModelOverview";
import ModelMetricsTable from "@/components/ModelMetricsTable";
import ModelCoefficientsTable from "@/components/ModelCoefficientsTable";

export const dynamic = "force-dynamic";

export default function ModelPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">ML Probability Model</h1>
          <p className="text-sm text-zinc-500">
            Trained classifier replacing BSM on calibration + PnL
          </p>
        </header>
        <ModelOverview />
        <ModelMetricsTable />
        <ModelCoefficientsTable />
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/20 p-4 text-xs text-zinc-500">
          <strong className="text-zinc-400">Caveats:</strong> metrics are
          measured on the held-out test split at training time, not live
          paper/real flow. Calibration MAE is the mean absolute gap between
          predicted probability and empirical hit rate across deciles. PnL @
          ≥25 edge simulates contracts where |edge| ≥ 25 cents using the test
          set; maker fills are optimistic. Live performance can drift —
          confirm with paper before promoting.
        </div>
      </div>
    </main>
  );
}
