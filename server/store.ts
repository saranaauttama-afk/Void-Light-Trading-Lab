import type {LabState,RiskConfig} from '../shared/types.js';
const risk:RiskConfig={startingBalance:100,dailyProfitTargetPct:2,dailyLossLimitPct:2,maxTradesPerDay:6,maxPositionPct:25,cooldownMinutes:15};

// Daily boundary is configurable because "today" depends on which timezone the
// trader's day resets in. Offset is in minutes, e.g. 420 for UTC+7 (Thailand).
const TZ_OFFSET_MINUTES=Number(process.env.DAILY_RESET_TZ_OFFSET_MINUTES||0);
export function sessionDateKey(d=new Date()):string{
  const shifted=new Date(d.getTime()+TZ_OFFSET_MINUTES*60000);
  return shifted.toISOString().slice(0,10);
}

export const state:LabState={mode:'PAPER',status:'PAUSED',cash:100,asset:0,equity:100,dailyPnl:0,dailyPnlPct:0,trades:[],liveTrades:[],risk,sessionDate:sessionDateKey(),dailyStartingEquity:100,dailyTradeCount:0,lastTradeAt:null};

// Must run before any risk check or P&L calculation touches the state.
// A new calendar day resets the daily P&L baseline and trade counter, but never
// silently re-arms a DAILY_LIMIT session — trading only resumes when a human
// explicitly starts the session again.
export function ensureDailyRollover(){
  const today=sessionDateKey();
  if(today===state.sessionDate)return;
  state.sessionDate=today;
  state.dailyStartingEquity=state.equity;
  state.dailyTradeCount=0;
  state.dailyPnl=0;
  state.dailyPnlPct=0;
  if(state.status==='DAILY_LIMIT')state.status='PAUSED';
}

export function mark(price:number){
  ensureDailyRollover();
  state.equity=state.cash+state.asset*price;
  state.dailyPnl=state.equity-state.dailyStartingEquity;
  state.dailyPnlPct=state.dailyStartingEquity?state.dailyPnl/state.dailyStartingEquity*100:0;
  if(state.dailyPnlPct>=state.risk.dailyProfitTargetPct||state.dailyPnlPct<=-state.risk.dailyLossLimitPct)state.status='DAILY_LIMIT';
}

// Call once, right after an order actually executes (paper or live).
export function recordTradeForRiskTracking(){
  state.dailyTradeCount+=1;
  state.lastTradeAt=new Date().toISOString();
}
