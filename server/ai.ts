import {getCandles} from './candles.js';import {analyze} from './strategy.js';
type Regime='TREND_UP'|'TREND_DOWN'|'RANGE'|'VOLATILE'|'UNCLEAR';
export async function aiMarketContext(symbol='BTCUSDT'){
 const intervals=['15m','1h','4h'];
 const features=await Promise.all(intervals.map(async interval=>({interval,...analyze(await getCandles(symbol,interval,250))})));
 const key=process.env.OPENAI_API_KEY;
 if(!key)return{enabled:false,model:null,regime:'UNAVAILABLE',confidence:0,summary:'Configure OPENAI_API_KEY on the server to enable AI research context.',risks:[],features};
 const model=process.env.OPENAI_MODEL||'gpt-5.6-luna';
 const prompt='Classify the supplied crypto market features for a PAPER-TRADING research lab. Do not give buy/sell instructions or financial advice. Return JSON only: regime (TREND_UP, TREND_DOWN, RANGE, VOLATILE, UNCLEAR), confidence integer 0-100, summary max 2 sentences, risks array max 4 short strings. Features: '+JSON.stringify(features);
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,input:prompt,reasoning:{effort:'low'}})});
 if(!response.ok)throw new Error('OpenAI analysis failed: '+response.status);
 const data=await response.json() as any;
 const raw=data.output_text??data.output?.flatMap((o:any)=>o.content??[]).find((c:any)=>c.type==='output_text')?.text;
 if(!raw)throw new Error('OpenAI returned no text');
 const cleaned=String(raw).replace(/^\`\`\`json\s*/,'').replace(/\`\`\`$/,'').trim();
 const parsed=JSON.parse(cleaned) as {regime:Regime;confidence:number;summary:string;risks:string[]};
 return{enabled:true,model,regime:parsed.regime,confidence:Math.max(0,Math.min(100,Number(parsed.confidence)||0)),summary:String(parsed.summary||''),risks:Array.isArray(parsed.risks)?parsed.risks.slice(0,4):[],features};
}
