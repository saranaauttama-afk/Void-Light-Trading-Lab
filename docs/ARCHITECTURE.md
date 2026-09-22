# Architecture

```
Binance public data
      |
      v
Market / Feature Engine
      |
      +--> Backtester
      |
      v
Strategy / AI Context
      |
      v
Risk Engine (veto authority)
      |
      v
Paper Execution
      |
      v
Ledger + Dashboard
```

## Trust boundaries
- Browser: no secrets.
- Server: owns external API calls.
- AI: analysis context only; never credentials.
- Risk Engine: deterministic and authoritative.
- Execution: paper-only in v0.1.

## Initial risk defaults
Starting balance $100; daily profit stop +2%; daily loss stop -2%; max 6 trades/session; max 25% equity per position. These are engineering defaults for simulation, not claims of optimal trading parameters.
