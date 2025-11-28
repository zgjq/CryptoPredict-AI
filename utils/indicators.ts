import { KlineData, TechnicalIndicators } from '../types';

export const calculateSMA = (data: number[], period: number): number => {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
};

// Internal helper to calculate the full EMA series using SMA initialization
// This ensures values match standard charting tools (TradingView/Binance)
const calculateEMASeries = (data: number[], period: number): number[] => {
  if (data.length < period) return new Array(data.length).fill(0);
  
  const k = 2 / (period + 1);
  const emaSeries = new Array(data.length).fill(0);
  
  // 1. Initialize the first EMA value with the SMA of the first 'period' elements
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  const sma = sum / period;
  
  // Set the initialization point
  emaSeries[period - 1] = sma;

  // 2. Calculate the rest of the EMA series
  // Formula: (Close - PrevEMA) * k + PrevEMA
  for (let i = period; i < data.length; i++) {
    emaSeries[i] = (data[i] - emaSeries[i - 1]) * k + emaSeries[i - 1];
  }
  
  return emaSeries;
};

export const calculateEMA = (data: number[], period: number): number => {
  const series = calculateEMASeries(data, period);
  // Return the most recent EMA value
  return series[series.length - 1];
};

export const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;

  // Standard RSI calculation with Wilder's Smoothing
  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smoothed averages
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    let gain = change > 0 ? change : 0;
    let loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

export const calculateMACD = (prices: number[], fast: number = 12, slow: number = 26, signal: number = 9) => {
  if (prices.length < slow + signal) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  // 1. Calculate Fast and Slow EMA Series
  const fastEMA = calculateEMASeries(prices, fast);
  const slowEMA = calculateEMASeries(prices, slow);

  // 2. Calculate MACD Line (Fast - Slow)
  // The slow EMA is only valid after index 'slow - 1', so we treat indices before that as invalid (0)
  const macdLine = fastEMA.map((f, i) => i < slow - 1 ? 0 : f - slowEMA[i]);

  // 3. Calculate Signal Line (EMA of MACD Line)
  // We must only use the valid part of the MACD line to initialize the Signal EMA
  const validStartIndex = slow - 1;
  const validMACDValues = macdLine.slice(validStartIndex);
  
  // Calculate EMA of the valid MACD values
  const signalLineSeriesValid = calculateEMASeries(validMACDValues, signal);
  
  // Get current (latest) values
  const currentMACD = validMACDValues[validMACDValues.length - 1];
  const currentSignal = signalLineSeriesValid[signalLineSeriesValid.length - 1];

  return {
    macdLine: currentMACD,
    signalLine: currentSignal,
    histogram: currentMACD - currentSignal
  };
};

export const calculateBollingerBands = (prices: number[], period: number = 20, multiplier: number = 2) => {
  if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };

  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    upper: sma + multiplier * stdDev,
    middle: sma,
    lower: sma - multiplier * stdDev
  };
};

export const processIndicators = (klines: KlineData[]): TechnicalIndicators => {
  const closePrices = klines.map(k => k.close);
  
  return {
    rsi: calculateRSI(closePrices),
    macd: calculateMACD(closePrices),
    bollinger: calculateBollingerBands(closePrices),
    ema50: calculateEMA(closePrices, 50),
    ema200: calculateEMA(closePrices, 200)
  };
};