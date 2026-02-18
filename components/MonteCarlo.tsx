import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, RotateCcw, Info, HelpCircle } from 'lucide-react';

interface SimulationParams {
  bankroll: number;
  winRate: number;
  avgOdds: number;
  betSizePct: number;
  numBets: number;
  numSimulations: number;
}

const MonteCarlo: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    bankroll: 10000,
    winRate: 0.55,
    avgOdds: 1.95,
    betSizePct: 0.02,
    numBets: 500,
    numSimulations: 50, // Reduced for frontend perf, but represents larger set
  });

  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ profitProb: 0, medianEnd: 0, ruinProb: 0 });

  const runSimulation = () => {
    const allRuns: any[] = [];
    let profitableRuns = 0;
    let ruinRuns = 0;
    const finalBankrolls: number[] = [];

    // Pre-calculate betting sequence
    for (let sim = 0; sim < params.numSimulations; sim++) {
      let currentBankroll = params.bankroll;
      const history = [{ step: 0, value: currentBankroll }];
      let isRuined = false;

      for (let i = 1; i <= params.numBets; i++) {
        if (currentBankroll <= 0) {
            isRuined = true;
            history.push({ step: i, value: 0 });
            continue;
        }

        const stake = currentBankroll * params.betSizePct;
        const won = Math.random() < params.winRate;
        
        if (won) {
            currentBankroll += stake * (params.avgOdds - 1);
        } else {
            currentBankroll -= stake;
        }

        // Downsample for chart performance (every 10 bets)
        if (i % 10 === 0 || i === params.numBets) {
            history.push({ step: i, value: currentBankroll });
        }
      }

      if (currentBankroll > params.bankroll) profitableRuns++;
      if (isRuined || currentBankroll <= 1) ruinRuns++;
      finalBankrolls.push(currentBankroll);
      
      // Store just the value for the chart data structure
      allRuns.push(history);
    }

    // Format for Recharts
    // Structure: [{step: 0, run0: 10000, run1: 10000...}, {step: 10, ...}]
    const chartData = [];
    const steps = allRuns[0].length;
    for (let i = 0; i < steps; i++) {
        const point: any = { step: allRuns[0][i].step };
        for (let j = 0; j < Math.min(params.numSimulations, 20); j++) { // Only plot 20 lines to keep it clean
            point[`run${j}`] = allRuns[j][i].value;
        }
        chartData.push(point);
    }

    finalBankrolls.sort((a, b) => a - b);
    const median = finalBankrolls[Math.floor(finalBankrolls.length / 2)];

    setData(chartData);
    setStats({
        profitProb: (profitableRuns / params.numSimulations) * 100,
        medianEnd: median,
        ruinProb: (ruinRuns / params.numSimulations) * 100
    });
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="h-full flex flex-col animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-1">Monte Carlo Simulation</h2>
                <p className="text-slate-400 text-sm">Project future bankroll growth based on statistical edge and variance.</p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
                 <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase">Median Result</div>
                    <div className={`text-xl font-mono font-bold ${stats.medianEnd >= params.bankroll ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${stats.medianEnd.toFixed(0)}
                    </div>
                 </div>
                 <div className="text-right border-l border-slate-700 pl-4">
                    <div className="text-xs text-slate-500 uppercase">Profit Prob</div>
                    <div className="text-xl font-mono font-bold text-blue-400">
                        {stats.profitProb.toFixed(1)}%
                    </div>
                 </div>
                 <div className="text-right border-l border-slate-700 pl-4">
                    <div className="text-xs text-slate-500 uppercase">Risk of Ruin</div>
                    <div className="text-xl font-mono font-bold text-red-400">
                        {stats.ruinProb.toFixed(1)}%
                    </div>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Controls */}
            <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-6 h-fit overflow-y-auto max-h-[calc(100vh-200px)]">
                
                {/* Bankroll */}
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <label className="text-sm font-bold text-slate-200">Starting Bankroll</label>
                        <span className="text-[10px] text-slate-500">e.g. 10000</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Total capital available for this strategy.</p>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                        <input 
                            type="number" 
                            value={params.bankroll}
                            onChange={(e) => setParams({...params, bankroll: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-slate-600 rounded pl-7 pr-3 py-2 text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Win Rate */}
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <label className="text-sm font-bold text-slate-200">Win Rate</label>
                        <span className="text-[10px] text-slate-500">e.g. 0.55</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                        Your expected strike rate (0.0 - 1.0).<br/>
                        <span className="text-emerald-500/80">Professional Target: {'>'} 0.53</span>
                    </p>
                    <input 
                        type="number" step="0.01" max="1"
                        value={params.winRate}
                        onChange={(e) => setParams({...params, winRate: Number(e.target.value)})}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Average Odds */}
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <label className="text-sm font-bold text-slate-200">Avg Odds (Decimal)</label>
                        <span className="text-[10px] text-slate-500">e.g. 1.95</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                        Average price taken. <br/>
                        <span className="text-slate-500">2.00 = Even Money | 1.91 = -110 US</span>
                    </p>
                    <input 
                        type="number" step="0.01"
                        value={params.avgOdds}
                        onChange={(e) => setParams({...params, avgOdds: Number(e.target.value)})}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Bet Size */}
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <label className="text-sm font-bold text-slate-200">Stake %</label>
                        <span className="text-[10px] text-slate-500">e.g. 0.02</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                        Fraction of bankroll wagered per bet.<br/>
                        <span className="text-rose-400/80">Recommended: {'<'} 0.05 (5%)</span>
                    </p>
                    <input 
                        type="number" step="0.005"
                        value={params.betSizePct}
                        onChange={(e) => setParams({...params, betSizePct: Number(e.target.value)})}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Num Bets */}
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <label className="text-sm font-bold text-slate-200">Simulation Steps</label>
                        <span className="text-[10px] text-slate-500">e.g. 500</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Total number of bets to simulate.</p>
                    <input 
                        type="number"
                        value={params.numBets}
                        onChange={(e) => setParams({...params, numBets: Number(e.target.value)})}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <button 
                    onClick={runSimulation}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-900/20 mt-2"
                >
                    <RotateCcw size={18} /> Re-Run Simulation
                </button>
            </div>

            {/* Chart */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-lg p-4 h-[600px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                            dataKey="step" 
                            stroke="#475569" 
                            tick={{fill: '#475569', fontSize: 12}}
                            label={{ value: 'Number of Bets', position: 'insideBottom', offset: -10, fill: '#475569' }}
                        />
                        <YAxis 
                            stroke="#475569" 
                            tick={{fill: '#475569', fontSize: 12}} 
                            domain={['auto', 'auto']}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                            itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
                            formatter={(value: number) => [`$${value.toFixed(0)}`, 'Bankroll']}
                        />
                        {/* Render multiple lines for variance visualization */}
                        {Array.from({ length: Math.min(params.numSimulations, 20) }).map((_, idx) => (
                            <Line 
                                key={idx} 
                                type="monotone" 
                                dataKey={`run${idx}`} 
                                stroke={idx === 0 ? "#10b981" : "#3b82f6"} 
                                strokeWidth={idx === 0 ? 3 : 1}
                                strokeOpacity={idx === 0 ? 1 : 0.15}
                                dot={false} 
                                activeDot={{ r: 4 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                     <div className="bg-slate-800/80 px-3 py-1.5 rounded text-xs text-emerald-400 font-bold border border-emerald-900/50 flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-emerald-500"></div> First Run Path
                     </div>
                     <div className="bg-slate-800/80 px-3 py-1.5 rounded text-xs text-blue-300/80 border border-blue-900/30 flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500/50"></div> 20 Sample Paths
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MonteCarlo;