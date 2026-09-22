import type {LabState,RiskConfig} from '../shared/types.js';
const risk:RiskConfig={startingBalance:100,dailyProfitTargetPct:2,dailyLossLimitPct:2,maxTradesPerDay:6,maxPositionPct:25,cooldownMinutes:15};
export const state:LabState={mode:'PAPER',status:'PAUSED',cash:100,asset:0,equity:100,dailyPnl:0,dailyPnlPct:0,trades:[],risk};
export function mark(price:number){state.equity=state.cash+state.asset*price;state.dailyPnl=state.equity-state.risk.startingBalance;state.dailyPnlPct=state.dailyPnl/state.risk.startingBalance*100;if(state.dailyPnlPct>=state.risk.dailyProfitTargetPct||state.dailyPnlPct<=-state.risk.dailyLossLimitPct)state.status='DAILY_LIMIT';}
