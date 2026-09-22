export type Candle={openTime:number;open:number;high:number;low:number;close:number;volume:number};
const ema=(xs:number[],p:number)=>{const k=2/(p+1);let v=xs[0]??0;return xs.map(x=>(v=x*k+v*(1-k)))};
export function analyze(c:Candle[]){
 const closes=c.map(x=>x.close); if(closes.length<30)return{signal:'WAIT',reason:'Need more candles',fast:0,slow:0};
 const f=ema(closes,9),s=ema(closes,21),i=closes.length-1;
 const signal=f[i]>s[i]?'BULLISH':f[i]<s[i]?'BEARISH':'NEUTRAL';
 return{signal,fast:f[i],slow:s[i],reason:`EMA9 ${f[i].toFixed(2)} vs EMA21 ${s[i].toFixed(2)}`};
}
export function backtest(c:Candle[],feePct=.1){
 let cash=100,asset=0,trades=0,peak=100,maxDd=0;
 const curve:{t:number;equity:number}[]=[];
 for(let i=30;i<c.length;i++){const slice=c.slice(0,i+1),a=analyze(slice),p=c[i].close;
  if(a.signal==='BULLISH'&&asset===0){const spend=cash*.25,fee=spend*feePct/100;asset=(spend-fee)/p;cash-=spend;trades++}
  if(a.signal==='BEARISH'&&asset>0){const gross=asset*p,fee=gross*feePct/100;cash+=gross-fee;asset=0;trades++}
  const eq=cash+asset*p;peak=Math.max(peak,eq);maxDd=Math.max(maxDd,(peak-eq)/peak*100);curve.push({t:c[i].openTime,equity:eq});
 }
 const final=cash+asset*(c.at(-1)?.close??0);return{startingEquity:100,finalEquity:final,returnPct:final-100,maxDrawdownPct:maxDd,trades,feePct,curve:curve.filter((_,i)=>i%Math.max(1,Math.floor(curve.length/80))===0)};
}
