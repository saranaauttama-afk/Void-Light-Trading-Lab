import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {getMarket} from './market.js';
import {state,mark} from './store.js';
import {riskCheck} from './risk.js';
import type {Side} from '../shared/types.js';
const app=express(); app.use(cors()); app.use(express.json());
app.get('/api/health',(_,res)=>res.json({ok:true,mode:'PAPER',liveTrading:false}));
app.get('/api/market/:symbol',async(req,res)=>{try{res.json(await getMarket(req.params.symbol.toUpperCase()))}catch(e){res.status(502).json({error:e instanceof Error?e.message:'Market error'})}});
app.get('/api/state',async(_,res)=>{try{const m=await getMarket();mark(m.price);res.json(state)}catch{res.json(state)}});
app.post('/api/session',(req,res)=>{const action=req.body?.action;if(action==='start'&&state.status!=='DAILY_LIMIT')state.status='RUNNING';if(action==='pause')state.status='PAUSED';res.json(state)});
app.post('/api/paper/order',async(req,res)=>{
 try{
  const side=String(req.body?.side||'').toUpperCase() as Side;
  if(!['BUY','SELL'].includes(side)) return res.status(400).json({error:'Invalid side'});
  const m=await getMarket(); mark(m.price);
  const notional=Math.max(0,Number(req.body?.notional||0));
  const check=riskCheck(state,side,notional); if(!check.ok)return res.status(400).json({error:check.reason,state});
  const qty=notional/m.price;
  if(side==='SELL'&&qty>state.asset)return res.status(400).json({error:'Insufficient paper asset'});
  if(side==='BUY'){state.cash-=notional;state.asset+=qty}else{state.cash+=notional;state.asset-=qty}
  state.trades.unshift({id:crypto.randomUUID(),side,price:m.price,quantity:qty,notional,createdAt:new Date().toISOString(),reason:'Manual paper order'});
  mark(m.price); res.json({ok:true,state});
 }catch(e){res.status(500).json({error:e instanceof Error?e.message:'Order error'})}
});
const port=Number(process.env.PORT||8787); app.listen(port,()=>console.log(`Void Light server :${port} — PAPER ONLY`));
