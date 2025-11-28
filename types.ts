
export type Interval = '15m' | '1h' | '4h' | '1d';

export type Language = 'en' | 'zh';

export interface KlineData {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  ema50: number;
  ema200: number;
}

export interface CryptoData {
  symbol: string;
  price: number;
  change24h: number; // Percentage
  history: KlineData[];
  indicators: TechnicalIndicators | null;
  interval: Interval;
}

export interface PredictionResult {
  symbol: string;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  probability: number; // 0-100
  reasoning: string;
  keyFactors: string[];
  timestamp: number;
  interval: Interval;
}
