import{useEffect,useState}from'react';import type{LabState,MarketSnapshot,Side}from'../shared/types';
const API=import.meta.env.VITE_API_BASE||'http://localhost:8787';
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
export default function App(){
 const[m,setM]=useState<MarketSnapshot|null>(null),[s,setS]=useState<LabState|null>(null),[err,setErr]=useState('');
 async function refresh(){try{const[a,b]=await Promise.all([fetch(API+'/api/market/BTCUSDT'),fetch(API+'/api/state')]);setM(await a.json());setS(await b.json());setErr('')}catch{setErr('API unavailable — start the server')}}
 useEffect(()=>{refresh();const id=setInterval(refresh,10000);return()=>clearInterval(id)},[]);
 async function session(action:'start'|'pause'){await fetch(API+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});refresh()}
 async function order(side:Side){if(!s)return;const notional=Math.min(10,s.equity*s.risk.maxPositionPct/100);const r=await fetch(API+'/api/paper/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({side,notional})});const x=await r.json();if(!r.ok)setErr(x.error);else setErr('');refresh()}
 return <main><header><div><span className="eyebrow">VOID LIGHT</span><h1>Trading Lab</h1></div><div className="pill">PAPER ONLY · LIVE DISABLED</div></header>
 <section className="hero"><div><small>BTC / USDT</small><strong>{m?money(m.price):'—'}</strong><span className={m&&m.changePct>=0?'up':'down'}>{m?m.changePct.toFixed(2)+'% 24h':'Loading market…'}</span></div><div className="session"><button onClick={()=>session('start')}>Start session</button><button className="ghost" onClick={()=>session('pause')}>Pause</button></div></section>
 {err&&<div className="error">{err}</div>}
 <section className="grid">{[['Equity',s?money(s.equity):'—'],['Cash',s?money(s.cash):'—'],['BTC',s?s.asset.toFixed(6):'—'],['Daily P&L',s?money(s.dailyPnl):'—'],['Status',s?.status||'—'],['Trades',String(s?.trades.length??0)]].map(([a,b])=><article key={a}><small>{a}</small><b>{b}</b></article>)}</section>
 <section className="panel"><div><h2>Risk Guard</h2><p>Risk rules have authority over every paper order.</p></div><div className="rules">{s&&<><span>Profit stop <b>+{s.risk.dailyProfitTargetPct}%</b></span><span>Loss stop <b>-{s.risk.dailyLossLimitPct}%</b></span><span>Max trades <b>{s.risk.maxTradesPerDay}</b></span><span>Max position <b>{s.risk.maxPositionPct}%</b></span></>}</div></section>
 <section className="panel"><div><h2>Manual Paper Execution</h2><p>$10 test orders through the same Risk Engine. No exchange credentials.</p></div><div className="session"><button disabled={s?.status!=='RUNNING'} onClick={()=>order('BUY')}>Paper Buy $10</button><button disabled={s?.status!=='RUNNING'||!s?.asset} className="ghost" onClick={()=>order('SELL')}>Paper Sell $10</button></div></section>
 <section className="panel trades"><h2>Trade Log</h2>{!s?.trades.length?<p>No trades yet.</p>:s.trades.map(t=><div className="trade" key={t.id}><b className={t.side==='BUY'?'up':'down'}>{t.side}</b><span>{money(t.notional)} @ {money(t.price)}</span><small>{new Date(t.createdAt).toLocaleString()}</small></div>)}</section>
 <footer>Market data: Binance public API · Execution: local paper ledger · v0.1</footer></main>
}
