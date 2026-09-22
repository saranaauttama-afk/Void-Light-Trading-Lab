import type{Candle}from'./strategy.js';
export async function getCandles(symbol='BTCUSDT',interval='1h',limit=500):Promise<Candle[]>{
 const safeLimit=Math.min(1000,Math.max(50,limit));
 const u=`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${safeLimit}`;
 const r=await fetch(u);if(!r.ok)throw new Error(`Binance candles failed: ${r.status}`);
 const rows=await r.json() as unknown[][];
 return rows.map(x=>({openTime:Number(x[0]),open:Number(x[1]),high:Number(x[2]),low:Number(x[3]),close:Number(x[4]),volume:Number(x[5])}));
}
