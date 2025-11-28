
import React from 'react';
import { CryptoData, PredictionResult, Language } from '../types';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Cpu } from 'lucide-react';
import Chart from './Chart';
import IndicatorBadge from './IndicatorBadge';

interface Props {
  data: CryptoData;
  prediction: PredictionResult | null;
  loadingPrediction: boolean;
  onAnalyze: () => void;
  language: Language;
}

const CryptoCard: React.FC<Props> = ({ data, prediction, loadingPrediction, onAnalyze, language }) => {
  const isUp = data.change24h >= 0;
  const indicators = data.indicators;

  // Localization Dictionary
  const t = {
    currentPrice: language === 'zh' ? "当前价格" : "Current Price",
    analyzeBtn: language === 'zh' ? "分析市场" : "Analyzing Market...",
    predictNext: language === 'zh' ? `预测未来 ${data.interval}` : `Predict Next ${data.interval}`,
    analyzeDesc: language === 'zh' 
      ? `使用 Gemini 2.5 Flash 分析 ${data.interval} 技术指标并预测走势。` 
      : `Uses Gemini 2.5 Flash to analyze ${data.interval} technical indicators and predict movement.`,
    predictionLabel: language === 'zh' ? "Gemini 预测" : "Gemini Prediction",
    confidence: language === 'zh' ? "置信度" : "Confidence",
    keyFactors: language === 'zh' ? "关键因素" : "Key Factors",
    bullish: language === 'zh' ? "看涨" : "Bullish",
    bearish: language === 'zh' ? "看跌" : "Bearish",
    neutral: language === 'zh' ? "中性" : "Neutral",
    trend: language === 'zh' ? "趋势" : "Trend",
    aboveEma: language === 'zh' ? "看涨" : "Bullish", // Simplified for badge
    belowEma: language === 'zh' ? "看跌" : "Bearish",
  };

  // Determine indicator states for badges
  const rsiState = indicators ? (indicators.rsi > 70 ? 'bad' : indicators.rsi < 30 ? 'good' : 'neutral') : 'neutral';
  // If MACD histogram is positive, it implies bullish momentum
  const macdState = indicators ? (indicators.macd.histogram > 0 ? 'good' : 'bad') : 'neutral';
  const priceColor = isUp ? '#10b981' : '#f43f5e';

  const getDirectionLabel = (dir: string) => {
    if (dir === 'UP') return t.bullish;
    if (dir === 'DOWN') return t.bearish;
    return t.neutral;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden group">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white shadow-inner">
             {data.symbol.replace('USDT', '')}
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h2 className="text-lg font-bold text-white">{data.symbol}</h2>
               <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">
                 {data.interval}
               </span>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(data.change24h).toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white tracking-tight">
            ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400">{t.currentPrice}</div>
        </div>
      </div>

      {/* Technical Indicators Row */}
      {indicators && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <IndicatorBadge label="RSI (14)" value={indicators.rsi.toFixed(1)} condition={rsiState} />
          <IndicatorBadge label="MACD" value={indicators.macd.histogram.toFixed(2)} condition={macdState} />
          <IndicatorBadge 
            label={`${t.trend} (EMA50)`} 
            value={data.price > indicators.ema50 ? t.aboveEma : t.belowEma} 
            condition={data.price > indicators.ema50 ? 'good' : 'bad'} 
          />
        </div>
      )}

      {/* Prediction Section */}
      <div className="mt-6 border-t border-slate-700 pt-4">
        {!prediction ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
             <button 
                onClick={onAnalyze}
                disabled={loadingPrediction}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-6 py-2 rounded-full font-medium transition-all shadow-lg hover:shadow-indigo-500/25"
             >
                {loadingPrediction ? <RefreshCw className="animate-spin" size={18} /> : <Cpu size={18} />}
                {loadingPrediction ? t.analyzeBtn : t.predictNext}
             </button>
             <p className="text-xs text-slate-500 mt-3 max-w-[80%] mx-auto">
               {t.analyzeDesc}
             </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                   <span className="text-sm text-slate-400 font-medium">{t.predictionLabel} ({prediction.interval})</span>
                   <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">
                     {new Date(prediction.timestamp).toLocaleTimeString()}
                   </span>
                </div>
                {/* Re-analyze button small */}
                <button onClick={onAnalyze} disabled={loadingPrediction} className="text-slate-500 hover:text-white transition-colors">
                  <RefreshCw size={14} className={loadingPrediction ? "animate-spin" : ""} />
                </button>
             </div>
             
             <div className="flex items-center gap-4 mb-4">
                <div className={`
                    flex-1 py-3 px-4 rounded-lg border flex items-center justify-between
                    ${prediction.direction === 'UP' ? 'bg-emerald-900/20 border-emerald-500/50' : 
                      prediction.direction === 'DOWN' ? 'bg-rose-900/20 border-rose-500/50' : 
                      'bg-slate-700/30 border-slate-500/50'}
                `}>
                   <div className="flex items-center gap-2">
                      {prediction.direction === 'UP' && <TrendingUp className="text-emerald-400" size={24} />}
                      {prediction.direction === 'DOWN' && <TrendingDown className="text-rose-400" size={24} />}
                      {prediction.direction === 'NEUTRAL' && <Minus className="text-slate-400" size={24} />}
                      <span className={`text-xl font-bold ${
                          prediction.direction === 'UP' ? 'text-emerald-400' : 
                          prediction.direction === 'DOWN' ? 'text-rose-400' : 'text-slate-200'
                      }`}>
                        {getDirectionLabel(prediction.direction)}
                      </span>
                   </div>
                   <div className="text-right">
                      <div className="text-2xl font-bold text-white">{prediction.probability}%</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">{t.confidence}</div>
                   </div>
                </div>
             </div>

             <div className="space-y-3">
               <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                 {prediction.reasoning}
               </p>
               <div>
                 <div className="text-xs font-semibold text-slate-500 mb-2 uppercase">{t.keyFactors}</div>
                 <div className="flex flex-wrap gap-2">
                   {prediction.keyFactors.map((factor, idx) => (
                     <span key={idx} className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600">
                       {factor}
                     </span>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <Chart data={data.history} color={priceColor} />
    </div>
  );
};

export default CryptoCard;
