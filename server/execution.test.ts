import{describe,it,expect,beforeEach,afterEach}from'vitest';import{LiveExecutionEngine,PaperExecutionEngine}from'./execution';import{createOrderIntent}from'./order-intent';import type{LabState}from'../shared/types';
const state=():LabState=>({mode:'PAPER',status:'RUNNING',cash:100,asset:0,equity:100,dailyPnl:0,dailyPnlPct:0,trades:[],liveTrades:[],risk:{startingBalance:100,dailyProfitTargetPct:2,dailyLossLimitPct:2,maxTradesPerDay:6,maxPositionPct:25,cooldownMinutes:15},sessionDate:'2026-01-01',dailyStartingEquity:100,dailyTradeCount:0,lastTradeAt:null});

describe('execution boundary',()=>{
  it('paper engine executes against simulated state',async()=>{
    const s=state(),r=await new PaperExecutionEngine().execute(createOrderIntent('BTCUSDT','BUY',10,'test'),100,s);
    expect(r.ok).toBe(true);expect(s.cash).toBe(90);expect(s.asset).toBe(.1);expect(s.trades).toHaveLength(1);
  });

  describe('live engine — safe-by-default gating (no network calls)',()=>{
    const savedEnv={...process.env};
    beforeEach(()=>{delete process.env.LIVE_TRADING_ENABLED;delete process.env.BINANCE_API_KEY;delete process.env.BINANCE_API_SECRET;delete process.env.BINANCE_USE_TESTNET;delete process.env.CONFIRM_MAINNET_TRADING;});
    afterEach(()=>{process.env=savedEnv});

    it('refuses to trade when LIVE_TRADING_ENABLED is unset',async()=>{
      const r=await new LiveExecutionEngine().execute(createOrderIntent('BTCUSDT','BUY',10,'test'),100,state());
      expect(r.ok).toBe(false);
      expect(r.message).toContain('disabled');
    });

    it('refuses to trade when enabled but no credentials are configured',async()=>{
      process.env.LIVE_TRADING_ENABLED='true';
      const r=await new LiveExecutionEngine().execute(createOrderIntent('BTCUSDT','BUY',10,'test'),100,state());
      expect(r.ok).toBe(false);
      expect(r.message).toContain('not configured');
    });

    it('refuses mainnet unless CONFIRM_MAINNET_TRADING is also set',async()=>{
      process.env.LIVE_TRADING_ENABLED='true';
      process.env.BINANCE_API_KEY='key';
      process.env.BINANCE_API_SECRET='secret';
      process.env.BINANCE_USE_TESTNET='false';
      const r=await new LiveExecutionEngine().execute(createOrderIntent('BTCUSDT','BUY',10,'test'),100,state());
      expect(r.ok).toBe(false);
      expect(r.message).toContain('not configured');
    });
  });
});
