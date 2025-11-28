import { CryptoData, KlineData, Interval } from '../types';
import { processIndicators } from '../utils/indicators';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

export const fetchCryptoData = async (symbol: string, interval: Interval): Promise<CryptoData | null> => {
  try {
    // Fetch klines for technical analysis
    // Increased limit to 1000 to ensure EMA/MACD convergence matches standard charts (TradingView/Binance)
    const klineResponse = await fetch(`${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=1000`);
    if (!klineResponse.ok) throw new Error('Failed to fetch klines');
    
    const klineRaw = await klineResponse.json();
    
    const history: KlineData[] = klineRaw.map((k: any) => ({
      openTime: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6]
    }));

    // Fetch 24h ticker for change stats
    const tickerResponse = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`);
    if (!tickerResponse.ok) throw new Error('Failed to fetch ticker');
    const tickerRaw = await tickerResponse.json();

    const indicators = processIndicators(history);

    return {
      symbol,
      price: parseFloat(tickerRaw.lastPrice),
      change24h: parseFloat(tickerRaw.priceChangePercent),
      history,
      indicators,
      interval
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
};