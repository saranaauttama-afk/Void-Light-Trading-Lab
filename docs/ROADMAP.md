# Roadmap

## Phase 1 — Foundation (v0.1)
Public Binance market feed, paper ledger, dashboard, session control and independent risk guard.

## Phase 2 — Research engine
Historical candles, EMA/RSI/ATR/volume features, deterministic strategies, fees/slippage, backtest and out-of-sample split.

## Phase 3 — Forward testing
Persistent SQLite journal, scheduled sessions, cooldown, daily reset, equity/drawdown charts and comparable experiment runs.

## Phase 4 — AI research layer
Server-side model integration for market-regime classification and explanation. Structured outputs only. AI proposes context; deterministic strategy and risk guard retain authority.

## Phase 5 — Validation
Walk-forward testing, parameter stability checks, benchmark vs buy-and-hold, failure injection and paper forward-testing.

## Live boundary
Live trading is intentionally outside the initial implementation. Any future live adapter must be separately gated, never expose withdrawal permissions, keep credentials server-side, include explicit human confirmation and a hard kill switch.
