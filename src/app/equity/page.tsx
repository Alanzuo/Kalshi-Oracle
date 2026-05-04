// src/app/equity/page.tsx — Equity Curves route
import EquityCurves from "@/components/EquityCurves";

export const dynamic = "force-dynamic";

export default function EquityPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Equity Curves</h1>
          <p className="text-sm text-zinc-500">
            Cumulative P&L per strategy
          </p>
        </header>
        <EquityCurves />
      </div>
    </main>
  );
}
