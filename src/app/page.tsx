// src/app/page.tsx — Strategy Comparison (default route)
import RealMoneyHero from "@/components/RealMoneyHero";
import StrategyTable from "@/components/StrategyTable";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">AlphaLine Trading</h1>
          <p className="text-sm text-zinc-500">
            Strategy ensemble — paper + live
          </p>
        </header>
        <RealMoneyHero />
        <StrategyTable />
      </div>
    </main>
  );
}
