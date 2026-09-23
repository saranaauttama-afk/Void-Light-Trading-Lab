# Void Light Trading Lab

AI-assisted crypto market research, strategy validation, and forward-testing lab.

**Current version: v0.6.0**

> Important project boundary: `LiveExecutionEngine` now places real Binance Spot market orders (testnet by default; mainnet requires a deliberate second confirmation flag). Live trading is **off** unless explicitly enabled — see section 10.

---

## 1. Goal

Void Light is intended to answer a research question before anything else:

> Can a deterministic trading strategy, optionally enriched by AI market context, survive fees, drawdown, unseen data, and forward testing?

The system therefore separates market observation, strategy, AI interpretation, risk approval, order intent, and execution. AI is never the execution layer and cannot bypass deterministic risk controls.

## 2. Current architecture

```text
Binance public market data
        |
        +--> Multi-timeframe features (15m / 1h / 4h)
        |        EMA9 / EMA21 / RSI14 / ATR14 / relative volume
        |
        +--> Deterministic Strategy Engine
        |
        +--> OpenAI Market Context (optional, read-only)
        |
        v
     OrderIntent
        |
        v
  Deterministic Risk Engine
        |
        v
   ExecutionEngine
      /       \
 Paper       Live
 READY       ADAPTER_NOT_INSTALLED
```

### Hard architectural rule

Strategy/AI code must never call an authenticated exchange endpoint directly. Any future execution integration must cross:

`OrderIntent -> Risk Engine -> ExecutionEngine`

Do not remove this boundary.

## 3. What is implemented

### Market data
- Binance public 24-hour ticker.
- Binance public candlesticks.
- Default research symbol: `BTCUSDT`.
- Scanner timeframes: `15m`, `1h`, `4h`.
- Candle requests are clamped to 50-1000 rows.

### Strategy
`server/strategy.ts`
- EMA 9 / EMA 21.
- RSI 14.
- ATR 14.
- Relative volume over recent 20 candles.
- Signals: `BULLISH`, `BEARISH`, `NEUTRAL`, `WAIT`.
- Current logic is intentionally simple and deterministic.

Current entry/exit behavior in the backtester:
- BULLISH while flat -> deploy 25% of cash.
- BEARISH while holding -> exit the entire simulated asset position.
- Default simulated fee: 0.1%.

This is a baseline research strategy, not a claim of profitability.

### Validation
- Full backtest.
- Buy & Hold benchmark.
- Strategy return vs benchmark (alpha).
- Maximum drawdown.
- 70/30 chronological validation.
- Last 30 candles before the split are retained as indicator warm-up for the unseen segment.
- Dashboard labels unseen results as OOS (out-of-sample).

Current `walkForward()` is a simple chronological holdout, not yet a multi-fold parameter-optimization walk-forward engine. Keep that distinction in future documentation.

### AI context
`server/ai.ts`

Optional server-side OpenAI classifier receives already-computed 15m/1h/4h technical features and returns:
- `TREND_UP`
- `TREND_DOWN`
- `RANGE`
- `VOLATILE`
- `UNCLEAR`
- confidence
- short summary
- risk observations

It is read-only market context. It does not create or approve orders.

If `OPENAI_API_KEY` is absent, the API returns a clean disabled state rather than failing the application.

### Risk engine
`server/risk.ts`

Current controls:
- Session must be RUNNING.
- Daily profit stop.
- Daily loss stop.
- Maximum trades per day.
- Maximum position notional as % of equity.
- Paper cash check for BUY.

Configured defaults:
- Starting paper equity: $100.
- Daily profit target: +2%.
- Daily loss limit: -2%.
- Max trades: 6.
- Max position: 25%.
- Cooldown configuration: 15 minutes.

**Known gap:** `cooldownMinutes` exists in config but is not yet enforced. This is a priority follow-up.

### Execution boundary
`server/execution.ts`

`ExecutionEngine` is the stable seam.

`PaperExecutionEngine`:
- Implemented.
- Mutates simulated cash/asset.
- Writes paper trade journal entries.
- Returns an execution result.

`LiveExecutionEngine`:
- Implemented for **Binance Spot** (`server/binance-client.ts`), MARKET orders sized by `quoteOrderQty` (spend/receive ~notional of quote currency; Binance computes the base quantity, so there's no local LOT_SIZE rounding to get wrong).
- Fails closed at every step: disabled unless `LIVE_TRADING_ENABLED=true`, requires `BINANCE_API_KEY`/`BINANCE_API_SECRET`, defaults to **testnet**, and mainnet requires the separate `CONFIRM_MAINNET_TRADING=true` flag.
- Writes fills to `state.liveTrades` — a separate ledger from the paper `cash`/`asset` fields, which live orders never touch.
- See section 10 for the full live-trading setup and its current limitations.

A future authorized implementation for another exchange should be isolated behind this same interface rather than changing strategy or AI code.

## 4. API

Default API origin: `http://localhost:8787`.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Service/mode status |
| GET | `/api/execution/capabilities` | Reports paper/live execution capability |
| GET | `/api/market/:symbol` | Public Binance ticker |
| GET | `/api/multi-analysis/:symbol` | 15m/1h/4h technical analysis |
| GET | `/api/research/:symbol` | Backtest + OOS validation |
| GET | `/api/ai-context/:symbol` | Optional AI market context |
| GET | `/api/state` | Current paper portfolio state |
| POST | `/api/session` | Start/pause paper session |
| POST | `/api/paper/order` | Submit manual order intent through risk + paper execution |
| POST | `/api/live/order` | Submit manual order intent through risk + **real** Binance execution (requires `confirm:true` in the body, plus the live env vars below) |
| GET | `/api/live/account` | Signed Binance account balance snapshot — the ledger of truth for live mode |

## 5. Important files for the next AI/developer

| File | Responsibility |
|---|---|
| `shared/types.ts` | Cross-layer contracts |
| `server/market.ts` | Binance public ticker |
| `server/candles.ts` | Binance public candles |
| `server/strategy.ts` | Indicators, baseline strategy, backtest, validation |
| `server/ai.ts` | Read-only OpenAI regime context |
| `server/risk.ts` | Deterministic veto layer |
| `server/order-intent.ts` | Creates normalized OrderIntent |
| `server/execution.ts` | Paper implementation + live adapter seam |
| `server/store.ts` | In-memory paper state |
| `server/index.ts` | HTTP API composition |
| `src/App.tsx` | Research dashboard |
| `src/styles.css` | Dashboard styles |
| `server/*.test.ts` | Core unit tests |

## 6. Local setup

Requirements:
- Node.js 22+ recommended.
- npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend:
`http://localhost:5173`

Backend:
`http://localhost:8787`

Quality checks:

```bash
npm test
npm run build
```

## 7. Environment variables

```env
PORT=8787
VITE_API_BASE=http://localhost:8787
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

### Secret rules
- Never commit `.env`.
- Never place secrets in a `VITE_*` variable.
- Never put secrets in React/localStorage.
- Never print secrets to logs.
- Never put secrets into AI prompts.
- Never include real credentials in tests, screenshots, issues, commits, or documentation.

`.env` is already ignored by Git.

## 8. Current data/storage behavior

Paper state is currently **in memory**. Restarting the backend resets the simulated portfolio and journal.

There is no database yet.

There is also no correct daily rollover baseline yet: `dailyPnl` currently compares equity with the original configured starting balance. This must be replaced by a per-session/per-day equity baseline before calling the daily controls production-quality.

Recommended next implementation:
1. Add a storage interface.
2. Persist state/journal to a local JSON store first (atomic write/rename).
3. Track `sessionDate` and `dailyStartingEquity`.
4. Reset daily counters/baseline at a configurable timezone boundary.
5. Keep portfolio holdings across daily rollover.
6. Later replace FileStore with SQLite without changing domain logic.

## 9. Known technical debt / correctness notes

An AI continuing this project should know these before adding features:

1. **Verified green on 2026-09-23**: `npm install`, `npm test` (15/15), and `npm run build` all pass. Two unrelated pre-existing build errors were fixed in the same pass: `tsconfig.node.json` was missing `target`/`lib` (broke `Array.prototype.at` in `server/strategy.ts`), and `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) was missing (broke `import.meta.env` in `src/App.tsx`).
2. Strategy RSI and ATR are simple baseline implementations; they are not Wilder-smoothed versions.
3. Backtest repeatedly analyzes growing candle slices and is O(n²). Fine for <=1000 candles, but refactor before large datasets.
4. Backtest does not yet expose closed-trade P&L, win rate, profit factor, total fees, slippage, expectancy, Sharpe/Sortino, or exposure time.
5. OOS validation is one 70/30 chronological holdout, not multi-fold walk-forward optimization.
6. Paper state is volatile/in-memory. So is live state (`state.liveTrades` and the daily counters) — a server restart forgets the day's live trade count and cooldown timer along with everything else. Persist `state` before relying on this for unattended live trading.
7. ~~Daily reset is not implemented correctly yet.~~ Fixed: `server/store.ts` now tracks `sessionDate`/`dailyStartingEquity` and rolls over at a configurable timezone boundary (`DAILY_RESET_TZ_OFFSET_MINUTES`). A `DAILY_LIMIT` status is never auto-cleared by rollover — it becomes `PAUSED` and still needs an explicit `/api/session {action:"start"}` to resume, on purpose.
8. ~~Cooldown config exists but is not enforced.~~ Fixed: `riskCheck` now rejects any order inside `cooldownMinutes` of `state.lastTradeAt`.
9. **Live P&L is not wired to the real exchange balance.** `state.equity`/`dailyPnl`/`dailyPnlPct` only ever reflect the paper ledger, even while live orders are being placed. Use `GET /api/live/account` for real balances. Treating the paper equity numbers as live P&L would be a genuine correctness bug for real-money use — don't build daily-loss-limit UI on those fields for live mode without fixing this first.
10. `LiveExecutionEngine` always submits **MARKET** orders. No LIMIT support, no slippage/price-band protection beyond what the exchange itself rejects, no retry/idempotency handling if the HTTP response is lost after Binance already filled the order (rare, but possible — check `/api/live/account` and Binance order history if a request times out, before resubmitting).
11. No minimum-notional pre-check against Binance's `exchangeInfo` — an order that's too small is currently only caught by Binance's own error response, surfaced as-is in `result.message`.

## 10. Live trading (Binance Spot)

Live trading is **off by default** and fails closed at every gate:

```env
LIVE_TRADING_ENABLED=true      # otherwise /api/live/order always returns ok:false
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
BINANCE_USE_TESTNET=true       # default even if omitted — mainnet is opt-in, not opt-out
CONFIRM_MAINNET_TRADING=false  # must ALSO be true to trade mainnet; one flag is not enough
```

Get testnet keys at https://testnet.binance.vision (separate account/keys from mainnet — nothing there is real money).

Placing an order:
```bash
curl -X POST http://localhost:8787/api/live/order \
  -H 'Content-Type: application/json' \
  -d '{"side":"BUY","notional":10,"confirm":true}'
```
`confirm:true` is required in the body — a safeguard against an accidental resubmit. The request still goes through the same `riskCheck` as paper orders (session status, daily P&L limits, max trades/day, cooldown, position sizing), skipping only the paper-cash check, since real available balance lives on the exchange, not in `state.cash`.

Before pointing this at mainnet: address items 6, 9, 10 and 11 above, and paper/testnet-trade the strategy for long enough to trust it — none of that risk judgment can be automated away by this codebase.
9. CORS currently uses default permissive middleware and should be environment-scoped before deployment.
10. API has no authentication because current use is local research.
11. AI output parsing currently trusts JSON-shaped model text; migrate to strict structured output/schema validation.
12. No rate limiting/cache around external market/AI calls.
13. No retry/backoff/timeout abstraction for external HTTP calls.
14. No exchange websocket/realtime stream yet.
15. There is no authenticated live exchange implementation.

## 10. Tests

Current unit coverage includes:
- bounded paper order risk approval
- oversized position rejection
- paused-session rejection
- strategy metrics stay finite
- OOS metrics stay finite
- paper execution mutates simulated state
- live execution boundary cannot transact

When changing domain contracts, update tests in the same commit.

## 11. Recommended roadmap for the next AI

### Phase A — correctness and persistence
- Run `npm install`, `npm test`, `npm run build`.
- Fix all failures before feature work.
- Add FileStore persistence.
- Add configurable timezone daily rollover.
- Enforce cooldown.
- Count daily trades rather than lifetime journal length.
- Add kill switch.
- Add tests for rollover, persistence, cooldown, duplicate intent/idempotency.

### Phase B — research quality
- Produce a trade ledger from backtests.
- Track fees explicitly.
- Add configurable slippage.
- Add win rate, profit factor, expectancy and exposure.
- Add benchmark drawdown.
- Add multiple chronological OOS folds.
- Separate indicator parameters from strategy code.
- Add experiment IDs/config snapshots so results are reproducible.

### Phase C — forward testing
- Add a scheduler/runner for automatic **paper** decisions.
- Generate strategy decisions on candle close, not arbitrary UI refresh.
- Store signal -> risk decision -> intent -> execution -> outcome as an auditable chain.
- Add restart-safe idempotency.
- Compare backtest vs forward-test drift.

### Phase D — AI research
- Move AI response to strict schema validation.
- Store AI context with timestamp/model/features.
- Measure strategy performance with and without AI context.
- Do not optimize prompts on the same OOS sample used for evaluation.
- AI remains context/research and must not bypass Risk Engine.

### Phase E — deployment hardening
- Restrict CORS.
- Add API authentication if deployed beyond localhost.
- Add rate limiting.
- Add request IDs and structured logs.
- Add health/readiness checks.
- Add persistence backup/export.
- Add CI only after verifying the workflow exists and runs.

## 12. Handoff instructions for another AI

When continuing from this repository:

1. Read this README completely.
2. Inspect `shared/types.ts`, `server/risk.ts`, `server/strategy.ts`, `server/execution.ts`, `server/store.ts`, and `server/index.ts`.
3. Run tests/build before modifying architecture.
4. Preserve the `OrderIntent -> Risk Engine -> ExecutionEngine` boundary.
5. Do not silently change risk defaults.
6. Keep secrets server-side.
7. Never claim a backtest result predicts future returns.
8. Document whether metrics are in-sample, out-of-sample, or forward-test.
9. Add tests with every domain behavior change.
10. Update this README whenever architecture, endpoints, safety boundaries, or known gaps change.

## 13. Definition of done for the next milestone

A good v0.7 milestone is:
- tests/build verified locally (currently pending; last install attempt timed out)
- restart-safe paper persistence
- correct daily baseline/reset
- cooldown enforcement
- kill switch
- idempotent intents
- richer backtest ledger/metrics
- README updated with actual verification status

Do not start by adding more indicators. Reliability and experiment integrity are higher priority.

---

Void Light is currently a **research system with a complete paper execution path and an explicit live adapter seam**. Treat the current deterministic risk and execution boundaries as core architecture, not temporary scaffolding.
