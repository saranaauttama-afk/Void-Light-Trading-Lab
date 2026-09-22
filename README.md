# Void Light Trading Lab

An experiment-first crypto trading research lab. **v0.1 is paper trading only. It cannot place live exchange orders.**

## What works
- BTC/USDT public market data from Binance
- $100 local paper portfolio
- Start/pause trading session
- Manual paper buy/sell routed through a Risk Engine
- Daily profit/loss stops, max trades and max position size
- Live mark-to-market equity and trade log
- Dark responsive dashboard

## Run
```bash
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173. API runs at http://localhost:8787.

## Safety architecture
Secrets never belong in the browser or AI prompt. Strategy/AI never bypasses Risk Engine. v0.1 deliberately has no authenticated Binance endpoint and no live execution adapter.

## Next
1. Candle history + indicator engine
2. Deterministic strategy + signal journal
3. Backtester with fees/slippage
4. SQLite persistence and daily-session reset
5. AI market-regime analysis with structured output
6. Forward-test reports and strategy comparison
7. Only after validation: design a separately gated live execution layer

See `docs/ROADMAP.md`.
