# Void Light Trading Lab

Experiment-first crypto trading research lab. **v0.3 is paper trading only and cannot place live exchange orders.**

## Current
- Binance BTC/USDT public ticker + historical candles
- $100 paper portfolio and forward-test journal
- Deterministic Risk Engine: daily stops, trade count and position limits
- Multi-timeframe 15m / 1h / 4h scanner
- EMA9/EMA21 + RSI14 + ATR14 + relative volume features
- Backtest comparison across timeframes with 0.1% simulated fees
- Equity curves, return, max drawdown and trade counts
- Unit tests + GitHub CI
- Responsive dark research dashboard

## Run
```bash
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173. API runs at http://localhost:8787.

## Boundary
No authenticated Binance endpoint exists. No live execution adapter exists. Secrets never belong in the browser or an AI prompt. Future AI analysis remains subordinate to deterministic risk controls.

## Next
Persistence/daily reset, richer experiment journal, out-of-sample/walk-forward validation, benchmark comparison, then optional server-side AI regime analysis with structured outputs.
