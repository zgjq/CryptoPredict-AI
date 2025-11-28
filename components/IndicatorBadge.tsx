import React from 'react';

interface Props {
  label: string;
  value: string | number;
  condition?: 'good' | 'bad' | 'neutral';
}

const IndicatorBadge: React.FC<Props> = ({ label, value, condition = 'neutral' }) => {
  let colorClass = "bg-slate-700 text-slate-200 border-slate-600";
  
  if (condition === 'good') {
    colorClass = "bg-emerald-900/30 text-emerald-400 border-emerald-800";
  } else if (condition === 'bad') {
    colorClass = "bg-rose-900/30 text-rose-400 border-rose-800";
  } else if (condition === 'neutral') {
    colorClass = "bg-blue-900/30 text-blue-400 border-blue-800";
  }

  return (
    <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${colorClass} text-xs font-medium`}>
      <span className="opacity-70 mb-1 uppercase tracking-wider text-[10px]">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
};

export default IndicatorBadge;
