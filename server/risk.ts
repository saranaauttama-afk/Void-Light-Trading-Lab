import type {LabState,Side} from '../shared/types.js';
export function riskCheck(state:LabState, side:Side, notional:number){
  if(state.status!=='RUNNING') return {ok:false,reason:'Session is not running'};
  if(state.dailyPnlPct>=state.risk.dailyProfitTargetPct) return {ok:false,reason:'Daily profit target reached'};
  if(state.dailyPnlPct<=-state.risk.dailyLossLimitPct) return {ok:false,reason:'Daily loss limit reached'};
  if(state.trades.length>=state.risk.maxTradesPerDay) return {ok:false,reason:'Max trades reached'};
  if(notional>state.equity*(state.risk.maxPositionPct/100)) return {ok:false,reason:'Position size exceeds risk limit'};
  if(side==='BUY' && notional>state.cash) return {ok:false,reason:'Insufficient paper cash'};
  return {ok:true,reason:'Risk checks passed'};
}
