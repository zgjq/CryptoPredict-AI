
import { GoogleGenAI, Type } from "@google/genai";
import { CryptoData, PredictionResult, Language } from '../types';

// Initialize Gemini Client
const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("API Key not found in process.env");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeCrypto = async (data: CryptoData, language: Language): Promise<PredictionResult> => {
  const client = getClient();
  if (!client) {
    throw new Error("Missing API Key");
  }

  // Construct the technical summary prompt
  const indicators = data.indicators;
  if (!indicators) throw new Error("No indicators available");

  const intervalMap: Record<string, string> = {
    '15m': '15 Minutes',
    '1h': '1 Hour',
    '4h': '4 Hours',
    '1d': '1 Day'
  };
  const readableInterval = intervalMap[data.interval] || data.interval;

  const langInstruction = language === 'zh' 
    ? "IMPORTANT: Provide the 'reasoning' and 'keyFactors' in Simplified Chinese (zh-CN). Keep the 'prediction' field as the English enum (UP, DOWN, NEUTRAL)." 
    : "Provide the response in English.";

  const prompt = `
    Act as a senior financial crypto analyst. Analyze the following real-time data for ${data.symbol} to predict the price movement for the NEXT ${readableInterval.toUpperCase()}.
    
    Current Price: $${data.price.toFixed(2)}
    24h Change: ${data.change24h.toFixed(2)}%
    
    Technical Indicators (${readableInterval} Chart):
    - RSI (14): ${indicators.rsi.toFixed(2)} (Over 70 is overbought, under 30 is oversold)
    - MACD Histogram: ${indicators.macd.histogram.toFixed(4)} (Positive = Bullish momentum, Negative = Bearish)
    - MACD Line: ${indicators.macd.macdLine.toFixed(4)}
    - Signal Line: ${indicators.macd.signalLine.toFixed(4)}
    - Bollinger Bands: Upper ${indicators.bollinger.upper.toFixed(2)}, Lower ${indicators.bollinger.lower.toFixed(2)}
    - EMA (50): ${indicators.ema50.toFixed(2)}
    - EMA (200): ${indicators.ema200.toFixed(2)}
    
    Price relative to BB: ${data.price > indicators.bollinger.upper ? "Above Upper Band" : data.price < indicators.bollinger.lower ? "Below Lower Band" : "Inside Bands"}
    Price relative to EMA: ${data.price > indicators.ema50 ? "Above EMA50" : "Below EMA50"}
    
    Task:
    Provide a prediction for the next ${readableInterval} trend. 
    Determine direction (UP/DOWN/NEUTRAL) and a probability score (0-100%).
    Provide a concise reasoning and list 3 key technical factors influencing this decision.
    ${langInstruction}
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING, enum: ["UP", "DOWN", "NEUTRAL"] },
            probability: { type: Type.NUMBER, description: "Confidence percentage 0-100" },
            reasoning: { type: Type.STRING, description: "A short paragraph explaining the prediction" },
            keyFactors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "List of 3 short bullet points of key technical signals" 
            }
          },
          required: ["prediction", "probability", "reasoning", "keyFactors"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");

    const result = JSON.parse(jsonText);

    return {
      symbol: data.symbol,
      direction: result.prediction,
      probability: result.probability,
      reasoning: result.reasoning,
      keyFactors: result.keyFactors,
      timestamp: Date.now(),
      interval: data.interval
    };
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback error result
    return {
      symbol: data.symbol,
      direction: 'NEUTRAL',
      probability: 0,
      reasoning: language === 'zh' ? "由于API连接问题，分析失败。" : "Analysis failed due to API connection issue.",
      keyFactors: [language === 'zh' ? "API错误" : "API Error"],
      timestamp: Date.now(),
      interval: data.interval
    };
  }
};
