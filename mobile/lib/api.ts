import type {
  Analysis,
  ApiError,
  ExecutionCapabilities,
  LabState,
  LiveAccountSnapshot,
  MarketSnapshot,
  OrderResponse,
  ResearchResult,
  Side,
} from './types';

export class ApiRequestError extends Error {
  state?: LabState;
  constructor(message: string, state?: LabState) {
    super(message);
    this.state = state;
  }
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiRequestError(
      `Can't reach the server at ${baseUrl}. Check it's running and the IP is right in Settings.`,
    );
  }
  const body = (await res.json().catch(() => ({}))) as T & Partial<ApiError>;
  if (!res.ok) {
    throw new ApiRequestError((body as ApiError)?.error ?? `Request failed (${res.status})`, (body as ApiError)?.state);
  }
  return body as T;
}

export const api = {
  health: (baseUrl: string) => request<{ ok: boolean; liveTrading: boolean }>(baseUrl, '/api/health'),

  market: (baseUrl: string, symbol: string) => request<MarketSnapshot>(baseUrl, `/api/market/${symbol}`),

  multiAnalysis: (baseUrl: string, symbol: string) =>
    request<Analysis[]>(baseUrl, `/api/multi-analysis/${symbol}`),

  research: (baseUrl: string, symbol: string) =>
    request<ResearchResult[]>(baseUrl, `/api/research/${symbol}`),

  aiContext: (baseUrl: string, symbol: string) =>
    request<{ enabled: boolean; regime: string; confidence: number; summary: string; risks: string[] }>(
      baseUrl,
      `/api/ai-context/${symbol}`,
    ),

  state: (baseUrl: string) => request<LabState>(baseUrl, '/api/state'),

  session: (baseUrl: string, action: 'start' | 'pause') =>
    request<LabState>(baseUrl, '/api/session', { method: 'POST', body: JSON.stringify({ action }) }),

  paperOrder: (baseUrl: string, side: Side, notional: number) =>
    request<OrderResponse>(baseUrl, '/api/paper/order', {
      method: 'POST',
      body: JSON.stringify({ side, notional }),
    }),

  liveOrder: (baseUrl: string, side: Side, notional: number) =>
    request<OrderResponse>(baseUrl, '/api/live/order', {
      method: 'POST',
      body: JSON.stringify({ side, notional, confirm: true }),
    }),

  liveAccount: (baseUrl: string) => request<LiveAccountSnapshot>(baseUrl, '/api/live/account'),

  capabilities: (baseUrl: string) => request<ExecutionCapabilities>(baseUrl, '/api/execution/capabilities'),
};
