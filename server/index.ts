import 'dotenv/config';import express from'express';import cors from'cors';import{getMarket}from'./market.js';import{getCandles}from'./candles.js';import{analyze,backtest,walkForward}from'./strategy.js';import{aiMarketContext}from'./ai.js';import{state,mark,recordTradeForRiskTracking}from'./store.js';import{riskCheck}from'./risk.js';import{paperExecution,liveExecution}from'./execution.js';import{loadBinanceConfig,getAccountBalances}from'./binance-client.js';import{createOrderIntent}from'./order-intent.js';import type{Side}from'../shared/types.js';

const app=express();app.use(cors());app.use(express.json());

function liveStatus(){
  const enabled=process.env.LIVE_TRADING_ENABLED==='true';
  const cfg=enabled?loadBinanceConfig():null;
  return{available:!!cfg,enabled,configured:!!cfg,network:cfg?(cfg.isTestnet?'TESTNET':'MAINNET'):null};
}

app.get('/api/health',(_,res)=>{const live=liveStatus();res.json({ok:true,mode:'PAPER',liveTrading:live.available,execution:{paper:true,live}})});
app.get('/api/execution/capabilities',(_,res)=>{const live=liveStatus();res.json({paper:{available:true},live:{...live,engine:liveExecution.mode,status:live.available?`READY_${live.network}`:'NOT_CONFIGURED'},boundary:'OrderIntent -> Risk Engine -> ExecutionEngine'})});

app.get('/api/market/:symbol',async(req,res)=>{try{res.json(await getMarket(req.params.symbol.toUpperCase()))}catch(e){res.status(502).json({error:e instanceof Error?e.message:'Market error'})}});
app.get('/api/multi-analysis/:symbol',async(req,res)=>{try{const symbol=req.params.symbol.toUpperCase(),intervals=['15m','1h','4h'];res.json(await Promise.all(intervals.map(async interval=>({...analyze(await getCandles(symbol,interval,250)),interval}))))}catch(e){res.status(502).json({error:e instanceof Error?e.message:'Analysis error'})}});
app.get('/api/research/:symbol',async(req,res)=>{try{const symbol=req.params.symbol.toUpperCase(),intervals=['15m','1h','4h'];res.json(await Promise.all(intervals.map(async interval=>{const c=await getCandles(symbol,interval,800);return{interval,backtest:backtest(c),walkForward:walkForward(c)}})))}catch(e){res.status(502).json({error:e instanceof Error?e.message:'Research error'})}});
app.get('/api/ai-context/:symbol',async(req,res)=>{try{res.json(await aiMarketContext(req.params.symbol.toUpperCase()))}catch(e){res.status(502).json({error:e instanceof Error?e.message:'AI context error'})}});
app.get('/api/state',async(_,res)=>{try{const m=await getMarket();mark(m.price);res.json(state)}catch{res.json(state)}});
app.post('/api/session',(req,res)=>{const action=req.body?.action;if(action==='start'&&state.status!=='DAILY_LIMIT')state.status='RUNNING';if(action==='pause')state.status='PAUSED';res.json(state)});

app.post('/api/paper/order',async(req,res)=>{
  try{
    const side=String(req.body?.side||'').toUpperCase()as Side;
    if(!['BUY','SELL'].includes(side))return res.status(400).json({error:'Invalid side'});
    const m=await getMarket();mark(m.price);
    const notional=Math.max(0,Number(req.body?.notional||0)),check=riskCheck(state,side,notional,'PAPER');
    if(!check.ok)return res.status(400).json({error:check.reason,state});
    const intent=createOrderIntent(m.symbol,side,notional,'Manual paper order');
    const result=await paperExecution.execute(intent,m.price,state);
    if(!result.ok)return res.status(400).json({error:result.message,state});
    recordTradeForRiskTracking();mark(m.price);
    res.json({ok:true,intent,result,state});
  }catch(e){res.status(500).json({error:e instanceof Error?e.message:'Order error'})}
});

// Real money. Same OrderIntent -> Risk -> Execution boundary as paper orders,
// plus two extra guards that have no paper equivalent: an explicit
// `confirm:true` in the request body (defends against a stray retry or a
// copy-pasted curl command), and every gate inside LiveExecutionEngine
// itself (LIVE_TRADING_ENABLED, credentials, testnet/mainnet confirmation).
app.post('/api/live/order',async(req,res)=>{
  try{
    const side=String(req.body?.side||'').toUpperCase()as Side;
    if(!['BUY','SELL'].includes(side))return res.status(400).json({error:'Invalid side'});
    if(req.body?.confirm!==true)return res.status(400).json({error:'Live orders require confirm:true in the request body'});
    const m=await getMarket();mark(m.price);
    const notional=Math.max(0,Number(req.body?.notional||0)),check=riskCheck(state,side,notional,'LIVE');
    if(!check.ok)return res.status(400).json({error:check.reason,state});
    const intent=createOrderIntent(m.symbol,side,notional,'Manual live order');
    const result=await liveExecution.execute(intent,m.price,state);
    if(!result.ok)return res.status(400).json({error:result.message,state});
    recordTradeForRiskTracking();
    res.json({ok:true,intent,result,state:{liveTrades:state.liveTrades}});
  }catch(e){res.status(500).json({error:e instanceof Error?e.message:'Live order error'})}
});

// Ledger of truth for live mode: state.cash/asset only ever reflect the paper
// account, so this is how to see what actually happened on the exchange.
app.get('/api/live/account',async(_,res)=>{
  const cfg=loadBinanceConfig();
  if(!cfg)return res.status(400).json({error:'Live trading is not configured'});
  try{res.json({network:cfg.isTestnet?'TESTNET':'MAINNET',balances:await getAccountBalances(cfg)})}
  catch(e){res.status(502).json({error:e instanceof Error?e.message:'Account fetch failed'})}
});

const port=Number(process.env.PORT||8787);
app.listen(port,()=>{const live=liveStatus();console.log(`Void Light server :${port} — PAPER${live.available?` + LIVE(${live.network})`:''}`)});
