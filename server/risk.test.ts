import{describe,it,expect}from'vitest';import{riskCheck}from'./risk';import type{LabState}from'../shared/types';
const base:LabState={mode:'PAPER',status:'RUNNING',cash:100,asset:0,equity:100,dailyPnl:0,dailyPnlPct:0,trades:[],liveTrades:[],risk:{startingBalance:100,dailyProfitTargetPct:2,dailyLossLimitPct:2,maxTradesPerDay:6,maxPositionPct:25,cooldownMinutes:15},sessionDate:'2026-01-01',dailyStartingEquity:100,dailyTradeCount:0,lastTradeAt:null};
describe('riskCheck',()=>{
  it('allows bounded paper order',()=>expect(riskCheck(base,'BUY',10).ok).toBe(true));
  it('blocks oversized position',()=>expect(riskCheck(base,'BUY',30).ok).toBe(false));
  it('blocks stopped session',()=>expect(riskCheck({...base,status:'PAUSED'},'BUY',10).ok).toBe(false));
  it('blocks once daily trade count is reached',()=>expect(riskCheck({...base,dailyTradeCount:6},'BUY',10).ok).toBe(false));
  it('blocks a trade inside the cooldown window',()=>{
    const r=riskCheck({...base,lastTradeAt:new Date().toISOString()},'BUY',10);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('Cooldown');
  });
  it('allows a trade once the cooldown window has passed',()=>{
    const past=new Date(Date.now()-16*60000).toISOString();
    expect(riskCheck({...base,lastTradeAt:past},'BUY',10).ok).toBe(true);
  });
  it('skips the paper-cash check in LIVE mode',()=>{
    expect(riskCheck({...base,cash:0},'BUY',10,'LIVE').ok).toBe(true);
    expect(riskCheck({...base,cash:0},'BUY',10,'PAPER').ok).toBe(false);
  });
});
