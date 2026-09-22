# Void Light Trading Lab

Crypto strategy research and forward-testing lab. **v0.6 is live-ready at the architecture boundary; authenticated live exchange execution is intentionally not implemented.**

## v0.6
- Binance public BTC/USDT market data and candles
- Multi-timeframe 15m / 1h / 4h scanner
- EMA9/EMA21, RSI14, ATR14 and relative volume
- Backtest + Buy & Hold benchmark + alpha
- 70/30 chronological out-of-sample validation
- Server-side OpenAI market-regime research
- Deterministic Risk Engine
- OrderIntent contract between decision and execution
- ExecutionEngine interface
- Complete PaperExecutionEngine
- LiveExecutionEngine boundary that returns ADAPTER_NOT_INSTALLED
- Execution capability endpoint and paper journal

## Architecture
```
Market Data
   |
Strategy + AI Context
   |
OrderIntent
   |
Risk Engine
   |
ExecutionEngine
   |-- PaperExecutionEngine (implemented)
   `-- LiveExecutionEngine  (boundary only)
```

Strategy and AI do not call an exchange. All execution must cross the OrderIntent/Risk/ExecutionEngine boundary.

## Run
```bash
npm install
cp .env.example .env
npm run dev
npm test
npm run build
```

Web: http://localhost:5173
API: http://localhost:8787

## Secrets
OPENAI_API_KEY is server-side only. Never place secrets in VITE_* variables, browser storage, source control, logs, AI prompts or screenshots.

## Live boundary
`server/execution.ts` contains the live adapter seam. The application is structured so a future authorized adapter can implement `ExecutionEngine` without changing strategy, AI, validation, risk or journal contracts. The current live implementation performs no authenticated exchange request and cannot create a live order.
