export type Side = 'BUY' | 'SELL';

export type MarketSnapshot = {
  symbol: string;
  price: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  updatedAt: string;
};

export type Analysis = {
  interval: string;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'WAIT';
  fast: number;
  slow: number;
  rsi: number;
  atr: number;
  volumeRatio: number;
  reason: string;
};

export type Trade = {
  id: string;
  side: Side;
  price: number;
  quantity: number;
  notional: number;
  createdAt: string;
  reason: string;
};

export type LiveTrade = {
  id: string;
  side: Side;
  symbol: string;
  requestedNotional: number;
  executedQty: number;
  executedQuoteQty: number;
  avgPrice: number;
  exchangeOrderId: string | number;
  status: string;
  createdAt: string;
};

export type RiskConfig = {
  startingBalance: number;
  dailyProfitTargetPct: number;
  dailyLossLimitPct: number;
  maxTradesPerDay: number;
  maxPositionPct: number;
  cooldownMinutes: number;
};

export type LabState = {
  mode: 'PAPER';
  status: 'RUNNING' | 'PAUSED' | 'DAILY_LIMIT';
  cash: number;
  asset: number;
  equity: number;
  dailyPnl: number;
  dailyPnlPct: number;
  trades: Trade[];
  liveTrades: LiveTrade[];
  risk: RiskConfig;
  sessionDate: string;
  dailyStartingEquity: number;
  dailyTradeCount: number;
  lastTradeAt: string | null;
};

export type BacktestResult = {
  startingEquity: number;
  finalEquity: number;
  returnPct: number;
  buyHoldPct: number;
  alphaPct: number;
  maxDrawdownPct: number;
  trades: number;
  feePct: number;
  curve: { t: number; equity: number }[];
};

export type WalkForwardResult = {
  splitPct: number;
  train: { returnPct: number; maxDrawdownPct: number; trades: number };
  outOfSample: {
    returnPct: number;
    maxDrawdownPct: number;
    trades: number;
    buyHoldPct: number;
    alphaPct: number;
  };
  passed: boolean;
};

export type ResearchResult = {
  interval: string;
  backtest: BacktestResult;
  walkForward: WalkForwardResult;
};

export type ExecutionCapabilities = {
  paper: { available: boolean };
  live: {
    available: boolean;
    enabled: boolean;
    configured: boolean;
    network: 'TESTNET' | 'MAINNET' | null;
    engine: 'LIVE';
    status: string;
  };
  boundary: string;
};

export type LiveAccountBalance = { asset: string; free: number; locked: number };
export type LiveAccountSnapshot = { network: 'TESTNET' | 'MAINNET'; balances: LiveAccountBalance[] };

export type OrderResponse = {
  ok: boolean;
  intent: { id: string; symbol: string; side: Side; notional: number; reason: string; createdAt: string };
  result: { ok: boolean; mode: 'PAPER' | 'LIVE'; executionId?: string; message: string };
  state: Partial<LabState>;
};

export type ApiError = { error: string; state?: LabState };
