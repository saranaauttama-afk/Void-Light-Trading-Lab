import type {MarketSnapshot} from '../shared/types.js';
const BASE='https://api.binance.com/api/v3';
export async function getMarket(symbol='BTCUSDT'):Promise<MarketSnapshot>{
  const r=await fetch(`${BASE}/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
  if(!r.ok) throw new Error(`Binance market data failed: ${r.status}`);
  const x=await r.json() as Record<string,string>;
  return {symbol,price:Number(x.lastPrice),changePct:Number(x.priceChangePercent),high:Number(x.highPrice),low:Number(x.lowPrice),volume:Number(x.volume),updatedAt:new Date().toISOString()};
}
