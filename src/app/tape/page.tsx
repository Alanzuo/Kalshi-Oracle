// src/app/tape/page.tsx — Live Tape route
import LiveTape from "@/components/LiveTape";

export const dynamic = "force-dynamic";

export default function TapePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Live Tape</h1>
          <p className="text-sm text-zinc-500">
            Real-time fire log across all strategies
          </p>
        </header>
        <LiveTape />
      </div>
    </main>
  );
}
