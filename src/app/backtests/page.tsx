// src/app/backtests/page.tsx — Backtest results route
import BacktestTable from "@/components/BacktestTable";

export const dynamic = "force-dynamic";

export default function BacktestsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Backtests</h1>
          <p className="text-sm text-zinc-500">
            Strategy comparison against historical paper_trades
          </p>
        </header>
        <BacktestTable />
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/20 p-4 text-xs text-zinc-500">
          <strong className="text-zinc-400">Caveats:</strong> backtest universe
          is paper_trades (signals that already passed live gates). Maker fills
          are simulated optimistically. Treat as a fast filter, not a verdict —
          paper still has to confirm.
        </div>
      </div>
    </main>
  );
}
