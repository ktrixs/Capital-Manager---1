import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, AlertTriangle, Info, DollarSign, Percent } from 'lucide-react';
import { getStartingBankroll } from '../services/journalService';
import { calculateKelly } from '../utils/analytics';

const KellyCalculator: React.FC = () => {
  const [bankroll, setBankroll] = useState(10000);
  const [odds, setOdds] = useState(2.00);
  const [winProb, setWinProb] = useState(55); // percent
  const [kellyFraction, setKellyFraction] = useState(0.5); // Half Kelly default

  useEffect(() => {
    // Load global bankroll as default, but allow override
    const savedBankroll = getStartingBankroll();
    if (savedBankroll) {
        setBankroll(savedBankroll);
    }
  }, []);

  // Expected Value Calculation for Display
  const p = winProb / 100;
  const evPercent = ((p * odds) - 1) * 100;
  const isPositiveEV = evPercent > 0;

  // Use Shared Utility for Kelly Calculation
  const { stake, percentage } = calculateKelly(odds, p, bankroll, kellyFraction);
  const fullKellyPercent = calculateKelly(odds, p, bankroll, 1.0).percentage * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
       <div className="flex items-center gap-3 mb-2">
            <Calculator className="text-blue-500" size={32} />
            <div>
                <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-wide">Kelly Criterion Calculator</h2>
                <p className="text-slate-400 text-xs">Optimal position sizing for +EV bets.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* INPUTS */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                    Bet Configuration
                </h3>

                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <label className="text-slate-300">Current Bankroll ($)</label>
                    </div>
                    <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-3 text-slate-500"/>
                        <input 
                            type="number" 
                            value={bankroll}
                            onChange={e => setBankroll(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded py-2 pl-9 pr-4 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Decimal Odds</label>
                        <input 
                            type="number" step="0.01"
                            value={odds}
                            onChange={e => setOdds(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                         <div className="text-[10px] text-slate-500 mt-1">
                            Implied: {odds > 0 ? (100/odds).toFixed(1) : 0}%
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Win Probability (%)</label>
                        <input 
                            type="number" step="0.1" max="100"
                            value={winProb}
                            onChange={e => setWinProb(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div>
                     <div className="flex justify-between text-sm mb-1">
                        <label className="text-slate-300">Kelly Fraction (Safety)</label>
                        <span className="text-blue-400 font-bold">{kellyFraction}x</span>
                    </div>
                    <input 
                        type="range" min="0.1" max="1" step="0.05"
                        value={kellyFraction}
                        onChange={e => setKellyFraction(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>0.1 (Conservative)</span>
                        <span>0.5 (Balanced)</span>
                        <span>1.0 (Aggressive)</span>
                    </div>
                </div>
            </div>

            {/* RESULTS */}
            <div className="space-y-6">
                 {/* EV CARD */}
                <div className={`p-6 rounded-lg border ${isPositiveEV ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-rose-900/10 border-rose-900/50'}`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className={isPositiveEV ? 'text-emerald-400' : 'text-rose-400'} />
                            <span className="font-bold text-slate-200">Expected Value (EV)</span>
                        </div>
                        <span className={`text-2xl font-mono font-bold ${isPositiveEV ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {evPercent > 0 ? '+' : ''}{evPercent.toFixed(2)}%
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">
                        {isPositiveEV 
                            ? "This bet has a positive statistical edge. Kelly Criterion recommends sizing based on your advantage." 
                            : "This bet has a negative expected value. Mathematical strategy advises AGAINST placing this wager."}
                    </p>
                </div>

                {/* OUTPUT METRICS */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                     <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                        Sizing Recommendation
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="text-xs text-slate-500 uppercase mb-1">Full Kelly</div>
                            <div className="text-lg font-mono text-slate-400">{fullKellyPercent.toFixed(2)}%</div>
                        </div>
                         <div>
                            <div className="text-xs text-slate-500 uppercase mb-1">Fractional ({kellyFraction}x)</div>
                            <div className={`text-xl font-mono font-bold ${stake > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                                {(percentage * 100).toFixed(2)}%
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800">
                         <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recommended Stake</span>
                            <span className={`text-4xl font-mono font-bold ${stake > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                ${stake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                         </div>
                         {stake > bankroll * 0.05 && (
                             <div className="mt-3 flex items-start gap-2 bg-yellow-900/20 p-2 rounded text-yellow-400 text-xs border border-yellow-900/30">
                                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                <span>High exposure warning. Consistently betting {'>'}5% of bankroll drastically increases risk of ruin, even with +EV. Consider lowering fractional Kelly.</span>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default KellyCalculator;