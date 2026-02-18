import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Percent, AlertTriangle } from 'lucide-react';

const ExpectedValueCalculator: React.FC = () => {
  const [odds, setOdds] = useState<number>(2.00);
  const [probability, setProbability] = useState<number>(50);
  const [stake, setStake] = useState<number>(100);

  // Calculations
  const winProb = probability / 100;
  // EV Formula: (Probability * (Odds - 1)) - ((1 - Probability) * 1)
  // Simplified: (Probability * Odds) - 1
  const evPercent = (winProb * odds) - 1;
  const evValue = stake * evPercent;
  const isPositive = evPercent > 0;
  const breakEvenProb = odds > 0 ? (100 / odds) : 0;
  const edge = probability - breakEvenProb;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
       <div className="flex items-center gap-3 mb-2">
            <Calculator className="text-emerald-500" size={32} />
            <div>
                <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-wide">Expected Value (EV) Calculator</h2>
                <p className="text-slate-400 text-xs">Calculate the mathematical value of a wager over the long run.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
                 <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                    Wager Details
                </h3>

                <div>
                    <label className="block text-sm text-slate-300 mb-1">Decimal Odds</label>
                    <input 
                        type="number" step="0.01" min="1.01"
                        value={odds}
                        onChange={(e) => setOdds(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">
                        Implied Probability: {odds > 0 ? breakEvenProb.toFixed(2) : 0}%
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-1">Win Probability (%)</label>
                    <div className="relative">
                        <input 
                            type="number" step="0.1" min="0" max="100"
                            value={probability}
                            onChange={(e) => setProbability(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                        <Percent size={14} className="absolute right-3 top-3 text-slate-500" />
                    </div>
                    <input 
                        type="range" min="0" max="100" step="0.5"
                        value={probability}
                        onChange={(e) => setProbability(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-3"
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-1">Wager Stake ($)</label>
                    <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-3 text-slate-500" />
                        <input 
                            type="number" step="1" min="0"
                            value={stake}
                            onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded py-2 pl-8 pr-3 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
                <div className={`p-6 rounded-lg border ${isPositive ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-rose-900/10 border-rose-900/50'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-200 flex items-center gap-2">
                            <TrendingUp size={20} className={isPositive ? 'text-emerald-400' : 'text-rose-400'} />
                            Expected Value (EV)
                        </h3>
                        <span className={`text-3xl font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {evPercent > 0 ? '+' : ''}{(evPercent * 100).toFixed(2)}%
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
                         <span className="text-sm text-slate-400">Projected Profit per Bet:</span>
                         <span className={`text-xl font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {evValue >= 0 ? '+' : '-'}${Math.abs(evValue).toFixed(2)}
                         </span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                        Analysis
                    </h3>
                    <div className="space-y-4 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Break-even Probability:</span>
                            <span className="font-mono">{breakEvenProb.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Your Probability:</span>
                            <span className={`font-mono font-bold ${probability > breakEvenProb ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {probability.toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex justify-between">
                             <span className="text-slate-500">Edge:</span>
                             <span className={`font-mono font-bold ${edge > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {edge > 0 ? '+' : ''}{edge.toFixed(2)}%
                             </span>
                        </div>
                    </div>

                    <div className="mt-6 text-xs text-slate-500 bg-slate-950 p-3 rounded border border-slate-800">
                        <div className="flex items-start gap-2">
                             <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                             <p>
                                {isPositive 
                                    ? "Positive EV indicates a profitable bet in the long run. If you placed this bet 100 times, you would expect to make a profit."
                                    : "Negative EV indicates a losing bet in the long run. The odds offered do not justify the risk based on your probability estimate."
                                }
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ExpectedValueCalculator;