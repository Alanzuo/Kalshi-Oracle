// src/app/strategy/[name]/page.tsx — per-strategy drilldown route
import StrategyDetail from "@/components/StrategyDetail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function StrategyPage({ params }: PageProps) {
  const { name } = await params;
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Strategy</h1>
          <p className="text-sm text-zinc-500 font-mono">{name}</p>
        </header>
        <StrategyDetail name={name} />
      </div>
    </main>
  );
}
