// src/lib/types.ts — TS types matching cc_* tables in Supabase

export type StrategyMode = "paper" | "live_pilot" | "live_full" | "disabled";

export interface Strategy {
  name: string;
  description: string | null;
  mode: StrategyMode;
  bankroll_usd: number;
  daily_loss_cap_usd: number;
  contracts_per_signal: number;
  n_total: number;
  n_open: number;
  n_won: number;
  n_lost: number;
  wr_pct: number | null;
  pnl_realized: number;
  pnl_today: number;
  at_risk_usd: number;
  total_spent_usd: number;
  roi_pct: number | null;
  updated_at: string;
}

export interface Trade {
  id: number;
  source: "real" | "strategy";
  strategy_name: string | null;
  opened_at_utc: string;
  market_ticker: string;
  underlying: string | null;
  side: "YES" | "NO";
  strike: number | null;
  entry_price_cents: number;
  contracts: number;
  entry_cost_usd: number;
  edge_pts_at_open: number | null;
  fair_prob_at_open: number | null;
  use_maker: boolean;
  realized_sigma_10m: number | null;
  close_time_utc: string | null;
  status: "OPEN" | "WON" | "LOST" | "CANCELED" | "REJECTED";
  pnl: number | null;
  settlement_result: string | null;
  settled_at_utc: string | null;
  notes: string | null;
}

export interface EquityPoint {
  strategy_name: string;
  bucket_utc: string;
  cumulative_pnl: number;
  n_settled: number;
}

export interface RealMoney {
  id: 1;
  lifetime_pnl: number;
  lifetime_n: number;
  today_pnl: number;
  today_n: number;
  open_n: number;
  open_at_risk_usd: number;
  kill_file_active: boolean;
  last_breaker_4h_pnl: number | null;
  updated_at: string;
}
