import type {LabState,Side} from '../shared/types.js';
// mode 'LIVE' skips the paper-cash check: real available balance is verified
// against the exchange account, not the local paper ledger.
export function riskCheck(state:LabState, side:Side, notional:number, mode:'PAPER'|'LIVE'='PAPER'){
  if(state.status!=='RUNNING') return {ok:false,reason:'Session is not running'};
  if(state.dailyPnlPct>=state.risk.dailyProfitTargetPct) return {ok:false,reason:'Daily profit target reached'};
  if(state.dailyPnlPct<=-state.risk.dailyLossLimitPct) return {ok:false,reason:'Daily loss limit reached'};
  if(state.dailyTradeCount>=state.risk.maxTradesPerDay) return {ok:false,reason:'Max trades reached'};
  if(state.lastTradeAt){
    const elapsedMinutes=(Date.now()-new Date(state.lastTradeAt).getTime())/60000;
    if(elapsedMinutes<state.risk.cooldownMinutes) return {ok:false,reason:`Cooldown active — ${Math.ceil(state.risk.cooldownMinutes-elapsedMinutes)} min remaining`};
  }
  if(notional>state.equity*(state.risk.maxPositionPct/100)) return {ok:false,reason:'Position size exceeds risk limit'};
  if(mode==='PAPER' && side==='BUY' && notional>state.cash) return {ok:false,reason:'Insufficient paper cash'};
  return {ok:true,reason:'Risk checks passed'};
}
