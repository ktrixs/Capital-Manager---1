import React, { useState, useEffect } from 'react';
import { analyzeMatch } from '../services/geminiService';
import { getStartingBankroll } from '../services/journalService';
import { calculateKelly } from '../utils/analytics';
import { PredictionResult, MarketOdds } from '../types';
import { Brain, Calculator, TrendingUp, AlertTriangle, PlayCircle, Clock, Activity, Settings2 } from 'lucide-react';

const PredictionEngine: React.FC = () => {
  const [matchInfo, setMatchInfo] = useState({ 
    home: 'Manchester City', 
    away: 'Arsenal', 
    league: 'Premier League',
    score: '0-0',
    minute: '45'
  });
  
  // Odds for the user's specific strategy
  const [marketOdds, setMarketOdds] = useState<MarketOdds>({ 
    doubleChance: 1.40, // Represents the Double Chance odds for the "Winning Team" the user has in mind
    over05: 1.10, 
    over15: 1.50 
  });
  
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  
  // Staking Config
  const [bankroll, setBankroll] = useState(10000);
  const [kellyFraction, setKellyFraction] = useState(0.5); // Default to Half Kelly

  useEffect(() => {
    setBankroll(getStartingBankroll());
  }, []);
  
  // Computed EV
  const calculateEV = (prob: number, odds: number) => (prob * odds) - 1;

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeMatch(
        matchInfo.home, 
        matchInfo.away, 
        matchInfo.league, 
        matchInfo.score,
        matchInfo.minute,
        "Second half betting strategy, focus on drift."
    );
    setPrediction(result);
    setLoading(false);
  };

  const renderBetCard = (title: string, prob: number, odds: number, sublabel?: string) => {
    const ev = calculateEV(prob, odds);
    const isValue = ev > 0;
    
    // Use the shared Kelly Utility
    const { stake, percentage } = calculateKelly(odds, prob, bankroll, kellyFraction);

    return (
      <div className={`p-4 rounded-lg border ${isValue ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-slate-700 bg-slate-800'} transition-all`}>
        <div className="flex justify-between items-center mb-2">
          <div>
              <span className="font-bold text-slate-200 block">{title}</span>
              {sublabel && <span className="text-[10px] text-slate-500">{sublabel}</span>}
          </div>
          <span className="text-xs font-mono text-slate-400">ODDS: {odds.toFixed(2)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-slate-500 uppercase">True Prob</div>
            <div className={`text-xl font-mono font-bold ${isValue ? 'text-emerald-400' : 'text-slate-300'}`}>
              {(prob * 100).toFixed(1)}%
            </div>
          </div>
          <div>
             <div className="text-xs text-slate-500 uppercase">Implied</div>
             <div className="text-xl font-mono font-bold text-slate-400">
               {((1/odds) * 100).toFixed(1)}%
             </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-700/50">
           <div className="flex justify-between items-center mb-2">
             <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expected Value</span>
             <span className={`font-mono font-bold ${isValue ? 'text-emerald-400' : 'text-red-400'}`}>
               {ev > 0 ? '+' : ''}{(ev * 100).toFixed(2)}%
             </span>
           </div>
           
           {/* Integrated Kelly Calculator Output */}
           {isValue && (
             <div className="bg-slate-900/50 rounded p-2 border border-blue-900/30">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <Calculator size={10} /> Rec. Stake ({kellyFraction}x Kelly)
                 </span>
               </div>
               <div className="flex justify-between items-baseline">
                 <span className="font-mono font-bold text-slate-100 text-lg">${stake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 <span className="font-mono text-xs text-slate-400">{(percentage * 100).toFixed(2)}% of Bank</span>
               </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Input Section */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Brain size={20} className="text-purple-400" /> Match Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">League</label>
                <input 
                  type="text" 
                  value={matchInfo.league}
                  onChange={(e) => setMatchInfo({...matchInfo, league: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-slate-400 mb-1">Home Team</label>
                   <input 
                    type="text" 
                    value={matchInfo.home}
                    onChange={(e) => setMatchInfo({...matchInfo, home: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-400 mb-1">Away Team</label>
                   <input 
                    type="text" 
                    value={matchInfo.away}
                    onChange={(e) => setMatchInfo({...matchInfo, away: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                   />
                </div>
              </div>

              {/* LIVE STATE INPUTS */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                     <Clock size={12} /> Minute
                   </label>
                   <input 
                    type="text" 
                    placeholder="e.g. 60"
                    value={matchInfo.minute}
                    onChange={(e) => setMatchInfo({...matchInfo, minute: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-center font-mono"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                     <Activity size={12} /> Live Score
                   </label>
                   <input 
                    type="text" 
                    placeholder="e.g. 1-0"
                    value={matchInfo.score}
                    onChange={(e) => setMatchInfo({...matchInfo, score: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-center font-mono"
                   />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Live Market Odds</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1 text-center whitespace-nowrap">Double Chance</span>
                    <input 
                      type="number" step="0.01"
                      value={marketOdds.doubleChance}
                      onChange={(e) => setMarketOdds({...marketOdds, doubleChance: parseFloat(e.target.value)})}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-center text-slate-200 font-mono"
                      title="Odds for Winning Team + Draw"
                    />
                  </div>
                   <div>
                    <span className="text-[10px] text-slate-500 block mb-1 text-center whitespace-nowrap">Over 0.5</span>
                    <input 
                      type="number" step="0.01"
                      value={marketOdds.over05}
                      onChange={(e) => setMarketOdds({...marketOdds, over05: parseFloat(e.target.value)})}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-center text-slate-200 font-mono"
                    />
                  </div>
                   <div>
                    <span className="text-[10px] text-slate-500 block mb-1 text-center whitespace-nowrap">Over 1.5</span>
                    <input 
                      type="number" step="0.01"
                      value={marketOdds.over15}
                      onChange={(e) => setMarketOdds({...marketOdds, over15: parseFloat(e.target.value)})}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-center text-slate-200 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-center">*Enter drifting odds for your target bets</p>
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all"
              >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <PlayCircle size={20} />}
                Run Live Prediction
              </button>
            </div>
          </div>

          {prediction && (
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                      <TrendingUp size={16} /> Model Confidence
                  </h4>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 mb-2">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${prediction.confidence}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-400">{prediction.confidence}% Confidence in second-half outcome.</p>
              </div>
          )}
        </div>

        {/* Results Section */}
        <div className="w-full md:w-2/3">
          {!prediction ? (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                <Brain size={48} className="mb-4 opacity-50" />
                <p>Awaiting live match data...</p>
             </div>
          ) : (
            <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-white">{matchInfo.home} <span className="text-slate-500 text-lg mx-2">vs</span> {matchInfo.away}</h2>
                        <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold animate-pulse flex items-center gap-2">
                            <Clock size={12} /> {matchInfo.minute}'
                        </div>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-6 bg-slate-900/50 p-3 rounded border-l-2 border-blue-500">{prediction.reasoning}</p>
                    
                    {/* Kelly Config Panel within Results */}
                    <div className="mb-6 p-4 bg-slate-900/30 rounded-lg border border-slate-700 flex items-center justify-between">
                       <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                           <Settings2 size={16} className="text-blue-400" /> Staking Strategy
                       </div>
                       <div className="flex items-center gap-4">
                           <div className="text-xs text-slate-400">
                               Bankroll: <span className="text-slate-200 font-mono">${bankroll.toLocaleString()}</span>
                           </div>
                           <div className="flex items-center gap-2">
                               <label className="text-xs text-slate-400">Fractional Kelly:</label>
                               <select 
                                    value={kellyFraction} 
                                    onChange={(e) => setKellyFraction(parseFloat(e.target.value))}
                                    className="bg-slate-800 border border-slate-600 rounded text-xs text-white px-2 py-1 outline-none"
                                >
                                   <option value={0.1}>0.1x (Conservative)</option>
                                   <option value={0.25}>0.25x (Cautious)</option>
                                   <option value={0.5}>0.5x (Balanced)</option>
                                   <option value={1}>1.0x (Aggressive)</option>
                               </select>
                           </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* We display the Double Chance that matches the user's likely intent (Highest Prob) or just 1X/X2 */}
                        {prediction.doubleChance1X > prediction.doubleChanceX2 
                            ? renderBetCard('Double Chance (1X)', prediction.doubleChance1X, marketOdds.doubleChance, 'Home/Draw')
                            : renderBetCard('Double Chance (X2)', prediction.doubleChanceX2, marketOdds.doubleChance, 'Away/Draw')
                        }
                        
                        {renderBetCard('Over 0.5 Goals', prediction.over05, marketOdds.over05)}
                        {renderBetCard('Over 1.5 Goals', prediction.over15, marketOdds.over15)}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <Calculator size={18} className="text-emerald-400" /> Second Half Strategy
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            The system is analyzing drift opportunities in the second half. 
                            It compares the model's true probability of <strong>Over 0.5/1.5</strong> and <strong>Double Chance</strong> against your entered live odds.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-900/10 p-2 rounded border border-yellow-900/30">
                            <AlertTriangle size={14} /> Ensure odds are from live in-play markets.
                        </div>
                     </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionEngine;