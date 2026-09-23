import {createHmac} from 'node:crypto';

// This file is the ONLY place authenticated Binance requests are built and
// signed. Nothing outside it should hold API keys or construct signatures —
// that keeps the credential surface area small and auditable.

const TESTNET_BASE = 'https://testnet.binance.vision';
const MAINNET_BASE = 'https://api.binance.com';

export type BinanceConfig = {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  isTestnet: boolean;
};

// Reads config fresh on every call (not cached at module load) so a changed
// .env + process restart is the only way credentials change — no stale keys
// held in memory across a long-running process.
export function loadBinanceConfig(): BinanceConfig | null {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const useTestnet = process.env.BINANCE_USE_TESTNET !== 'false'; // safe default: testnet
  if (!useTestnet && process.env.CONFIRM_MAINNET_TRADING !== 'true') {
    // Deliberate friction: flipping to mainnet requires a second, distinct
    // env var. A single typo or copy-pasted "false" should not be enough to
    // move real trading from testnet to mainnet.
    return null;
  }

  return {
    apiKey,
    apiSecret,
    baseUrl: useTestnet ? TESTNET_BASE : MAINNET_BASE,
    isTestnet: useTestnet,
  };
}

function sign(secret: string, query: string): string {
  return createHmac('sha256', secret).update(query).digest('hex');
}

async function signedRequest(
  cfg: BinanceConfig,
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, string | number>,
) {
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    timestamp: String(Date.now()),
    recvWindow: '5000',
  }).toString();
  const signature = sign(cfg.apiSecret, query);
  const url = `${cfg.baseUrl}${path}?${query}&signature=${signature}`;
  const res = await fetch(url, {
    method,
    headers: { 'X-MBX-APIKEY': cfg.apiKey },
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg = body?.msg ? `Binance error ${body.code}: ${body.msg}` : `Binance request failed: ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export type MarketOrderResult = {
  exchangeOrderId: string | number;
  status: string;
  executedQty: number;
  executedQuoteQty: number;
  avgPrice: number;
};

// MARKET order sized in quote currency (quoteOrderQty), which is what makes
// this line up with the app's "spend $X notional" model — Binance computes
// the base-asset quantity itself, so there's no local LOT_SIZE/stepSize
// rounding to get wrong.
export async function placeSpotMarketOrder(
  cfg: BinanceConfig,
  symbol: string,
  side: 'BUY' | 'SELL',
  quoteOrderQty: number,
): Promise<MarketOrderResult> {
  const body = await signedRequest(cfg, 'POST', '/api/v3/order', {
    symbol,
    side,
    type: 'MARKET',
    quoteOrderQty: quoteOrderQty.toFixed(2),
    newOrderRespType: 'FULL',
  });
  const fills: { price: string; qty: string }[] = body.fills ?? [];
  const executedQty = Number(body.executedQty ?? 0);
  const executedQuoteQty = Number(body.cummulativeQuoteQty ?? 0);
  const avgPrice = fills.length
    ? fills.reduce((s, f) => s + Number(f.price) * Number(f.qty), 0) / executedQty
    : executedQuoteQty && executedQty
      ? executedQuoteQty / executedQty
      : 0;
  return {
    exchangeOrderId: body.orderId,
    status: String(body.status ?? 'UNKNOWN'),
    executedQty,
    executedQuoteQty,
    avgPrice,
  };
}

export async function getAccountBalances(cfg: BinanceConfig) {
  const body = await signedRequest(cfg, 'GET', '/api/v3/account', {});
  const balances: { asset: string; free: string; locked: string }[] = body.balances ?? [];
  return balances
    .map((b) => ({ asset: b.asset, free: Number(b.free), locked: Number(b.locked) }))
    .filter((b) => b.free > 0 || b.locked > 0);
}
