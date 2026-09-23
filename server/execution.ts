import type{ExecutionResult,LabState,OrderIntent}from'../shared/types.js';
import {loadBinanceConfig, placeSpotMarketOrder} from './binance-client.js';

export interface ExecutionEngine{readonly mode:'PAPER'|'LIVE';execute(intent:OrderIntent,price:number,state:LabState):Promise<ExecutionResult>}

export class PaperExecutionEngine implements ExecutionEngine{readonly mode='PAPER' as const;async execute(i:OrderIntent,price:number,s:LabState){const qty=i.notional/price;if(i.side==='SELL'&&qty>s.asset)return{ok:false,mode:this.mode,message:'Insufficient paper asset'};if(i.side==='BUY'){s.cash-=i.notional;s.asset+=qty}else{s.cash+=i.notional;s.asset-=qty}s.trades.unshift({id:crypto.randomUUID(),side:i.side,price,quantity:qty,notional:i.notional,createdAt:new Date().toISOString(),reason:i.reason});return{ok:true,mode:this.mode,executionId:crypto.randomUUID(),message:'Paper execution completed'}}}

// Places a REAL market order on Binance Spot (testnet by default). Every gate
// below fails closed: if anything is missing or ambiguous, no order is sent.
// This is the only place in the app that can move real money — keep new
// features (limit orders, other exchanges, etc.) as new, equally-gated
// methods here rather than shortcuts around these checks.
export class LiveExecutionEngine implements ExecutionEngine{
  readonly mode='LIVE' as const;

  async execute(i:OrderIntent,price:number,s:LabState):Promise<ExecutionResult>{
    if(process.env.LIVE_TRADING_ENABLED!=='true'){
      return{ok:false,mode:this.mode,message:'Live trading is disabled. Set LIVE_TRADING_ENABLED=true to enable the live order endpoint.'};
    }
    const cfg=loadBinanceConfig();
    if(!cfg){
      return{ok:false,mode:this.mode,message:'Live trading is not configured: set BINANCE_API_KEY/BINANCE_API_SECRET, and if BINANCE_USE_TESTNET=false also set CONFIRM_MAINNET_TRADING=true.'};
    }
    if(i.notional<=0){
      return{ok:false,mode:this.mode,message:'Notional must be greater than 0'};
    }
    try{
      const result=await placeSpotMarketOrder(cfg,i.symbol,i.side,i.notional);
      s.liveTrades.unshift({
        id:crypto.randomUUID(),
        side:i.side,
        symbol:i.symbol,
        requestedNotional:i.notional,
        executedQty:result.executedQty,
        executedQuoteQty:result.executedQuoteQty,
        avgPrice:result.avgPrice||price,
        exchangeOrderId:result.exchangeOrderId,
        status:result.status,
        createdAt:new Date().toISOString(),
      });
      const network=cfg.isTestnet?'Binance Spot TESTNET':'Binance Spot MAINNET';
      return{ok:true,mode:this.mode,executionId:String(result.exchangeOrderId),message:`${network} order ${result.status}: filled ${result.executedQty} ${i.symbol.replace('USDT','')} @ avg ${result.avgPrice.toFixed(2)}`};
    }catch(e){
      return{ok:false,mode:this.mode,message:e instanceof Error?e.message:'Live order failed'};
    }
  }
}

export const paperExecution=new PaperExecutionEngine();export const liveExecution=new LiveExecutionEngine();
