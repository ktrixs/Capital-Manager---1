import React, { useState, useEffect } from 'react';
import { PieChart, DollarSign, Target, TrendingUp, Wallet, Landmark, Building, Coins, Save, AlertCircle, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { getAllocationState, saveAllocationState, getBets, getStartingBankroll } from '../services/journalService';
import { calculateStats } from '../utils/analytics';
import { AllocationState } from '../types';

const CapitalAllocation: React.FC = () => {
  // 1. Internal State for User Inputs
  const [assets, setAssets] = useState({ crypto: 0, realEstate: 12000, cash: -600, other: 0 });
  const [policy, setPolicy] = useState({ bettingSplit: 50, cryptoSplit: 30, cashSplit: 15, emergencySplit: 5 });
  const [settings, setSettings] = useState({ 
    targetGoal: 100000, 
    startNetWorth: 10000, 
    exchangeRate: 1000, // e.g. RWF/USD
    autoReinvest: true, 
    reinvestThreshold: 1000, 
    frequency: 'Weekly' 
  });
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlySchedule, setMonthlySchedule] = useState<Record<string, number[]>>({});
  
  // 2. Computed State from Journal
  const [bettingBankroll, setBettingBankroll] = useState(0);
  const [bettingProfit, setBettingProfit] = useState(0);
  const [startingCapital, setStartingCapital] = useState(0);

  // Load Data
  useEffect(() => {
    // Load config
    const saved = getAllocationState();
    if (saved) {
      setAssets(saved.assets);
      setPolicy(saved.policy);
      setSettings(saved.settings);
      
      // Handle migration from old format (number[]) to new format (Record<string, number[]>)
      if (Array.isArray(saved.monthlySchedule)) {
        setMonthlySchedule({
            [new Date().getFullYear().toString()]: saved.monthlySchedule
        });
      } else {
        setMonthlySchedule(saved.monthlySchedule || {});
      }
    }

    // Load Live Bankroll Data
    const bets = getBets();
    const startCap = getStartingBankroll();
    const stats = calculateStats(bets, startCap);
    
    setBettingBankroll(stats.currentBankroll);
    setBettingProfit(stats.profit);
    setStartingCapital(startCap);
  }, []);

  // Save on Change
  useEffect(() => {
    saveAllocationState({ assets, policy, settings, monthlySchedule });
  }, [assets, policy, settings, monthlySchedule]);

  // --- Calculations ---

  const totalNetWorth = bettingBankroll + assets.crypto + assets.realEstate + assets.cash + assets.other;
  const progressPct = Math.min((totalNetWorth / settings.targetGoal) * 100, 100);
  const remaining = settings.targetGoal - totalNetWorth;
  
  const monthlyGrowth = totalNetWorth - settings.startNetWorth;
  const monthlyGrowthPct = settings.startNetWorth > 0 ? (monthlyGrowth / settings.startNetWorth) * 100 : 0;
  // Annualized roughly = (1 + monthly rate)^12 - 1
  const annualizedGrowthPct = (Math.pow(1 + (monthlyGrowthPct / 100), 12) - 1) * 100;

  const milestones = [
    { target: 10000, label: '$10K Milestone' },
    { target: 25000, label: '$25K Milestone' },
    { target: 50000, label: '$50K Milestone' },
    { target: 75000, label: '$75K Milestone' },
    { target: 100000, label: '$100K GOAL' },
  ];

  // Allocation Calculations (Profit Distribution)
  // We apply the policy to the TOTAL PROFIT to see how it SHOULD be distributed
  const calcAlloc = (pct: number) => (bettingProfit * pct) / 100;
  
  // Calculate Total Distributed from Monthly Schedule (Cross Reference)
  const totalDistributed = (Object.values(monthlySchedule) as number[][]).reduce((total, yearAmounts) => {
      return total + yearAmounts.reduce((sum, val) => sum + (val || 0), 0);
  }, 0);

  const unallocatedProfit = bettingProfit - totalDistributed;

  // Helper for Input Changes
  const updateAsset = (k: keyof typeof assets, v: string) => setAssets(prev => ({ ...prev, [k]: parseFloat(v) || 0 }));
  const updatePolicy = (k: keyof typeof policy, v: string) => setPolicy(prev => ({ ...prev, [k]: parseFloat(v) || 0 }));
  const updateSettings = (k: keyof typeof settings, v: any) => setSettings(prev => ({ ...prev, [k]: v }));
  
  const updateSchedule = (year: number, index: number, val: string) => {
    const yearKey = year.toString();
    const currentYearData = monthlySchedule[yearKey] || new Array(12).fill(0);
    const newYearData = [...currentYearData];
    newYearData[index] = parseFloat(val) || 0;
    
    setMonthlySchedule(prev => ({
        ...prev,
        [yearKey]: newYearData
    }));
  };

  const getYearSchedule = (year: number) => {
      return monthlySchedule[year.toString()] || new Array(12).fill(0);
  };

  const totalPolicy = policy.bettingSplit + policy.cryptoSplit + policy.cashSplit + policy.emergencySplit;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-yellow-500 uppercase tracking-tight">Capital Allocation Engine</h2>
          <p className="text-slate-400 text-sm">Wealth management, profit distribution, and goal tracking system.</p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded border border-slate-700 flex items-center gap-3">
             <div className="text-xs text-slate-500 uppercase font-bold">Total Net Worth</div>
             <div className="text-2xl font-mono font-bold text-emerald-400">${totalNetWorth.toLocaleString()}</div>
        </div>
      </div>

      {/* TOP SECTION: WEALTH TRACKING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ASSET BREAKDOWN (Left) */}
        <div className="lg:col-span-6 space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
             <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-yellow-500 uppercase tracking-wider text-sm">Asset Class Breakdown</h3>
             </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/30 text-xs text-slate-500 uppercase font-medium">
                    <tr>
                        <th className="px-4 py-2">Asset Class</th>
                        <th className="px-4 py-2 text-right">Value (USD)</th>
                        <th className="px-4 py-2 text-right">Allocation %</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    <tr>
                        <td className="px-4 py-3 text-slate-300 flex items-center gap-2"><Wallet size={14} className="text-blue-400"/> Betting Bankroll</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">${bettingBankroll.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-400">{totalNetWorth !== 0 ? ((bettingBankroll/totalNetWorth)*100).toFixed(2) : 0}%</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-3 text-slate-300 flex items-center gap-2"><Coins size={14} className="text-purple-400"/> Crypto Portfolio</td>
                        <td className="px-4 py-3 text-right font-mono"><input className="bg-transparent text-right outline-none w-24 text-white focus:border-b focus:border-blue-500" value={assets.crypto} onChange={e => updateAsset('crypto', e.target.value)} /></td>
                        <td className="px-4 py-3 text-right font-mono text-blue-400">{totalNetWorth !== 0 ? ((assets.crypto/totalNetWorth)*100).toFixed(2) : 0}%</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-3 text-slate-300 flex items-center gap-2"><Building size={14} className="text-emerald-400"/> Real Estate / Land</td>
                        <td className="px-4 py-3 text-right font-mono"><input className="bg-transparent text-right outline-none w-24 text-white focus:border-b focus:border-blue-500" value={assets.realEstate} onChange={e => updateAsset('realEstate', e.target.value)} /></td>
                        <td className="px-4 py-3 text-right font-mono text-blue-400">{totalNetWorth !== 0 ? ((assets.realEstate/totalNetWorth)*100).toFixed(2) : 0}%</td>
                    </tr>
                     <tr>
                        <td className="px-4 py-3 text-slate-300 flex items-center gap-2"><Landmark size={14} className="text-slate-400"/> Cash Reserves</td>
                        <td className="px-4 py-3 text-right font-mono"><input className="bg-transparent text-right outline-none w-24 text-white focus:border-b focus:border-blue-500" value={assets.cash} onChange={e => updateAsset('cash', e.target.value)} /></td>
                        <td className="px-4 py-3 text-right font-mono text-blue-400">{totalNetWorth !== 0 ? ((assets.cash/totalNetWorth)*100).toFixed(2) : 0}%</td>
                    </tr>
                     <tr>
                        <td className="px-4 py-3 text-slate-300 flex items-center gap-2"><Target size={14} className="text-pink-400"/> Other Investments</td>
                        <td className="px-4 py-3 text-right font-mono"><input className="bg-transparent text-right outline-none w-24 text-white focus:border-b focus:border-blue-500" value={assets.other} onChange={e => updateAsset('other', e.target.value)} /></td>
                        <td className="px-4 py-3 text-right font-mono text-blue-400">{totalNetWorth !== 0 ? ((assets.other/totalNetWorth)*100).toFixed(2) : 0}%</td>
                    </tr>
                    <tr className="bg-slate-800/50 font-bold">
                        <td className="px-4 py-3 text-yellow-500">TOTAL NET WORTH</td>
                        <td className="px-4 py-3 text-right font-mono text-yellow-500">${totalNetWorth.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-yellow-500">100.00%</td>
                    </tr>
                </tbody>
             </table>
           </div>

           <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 font-bold text-yellow-500 uppercase tracking-wider text-sm">
                    Wealth Milestones
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/30 text-xs text-slate-500 uppercase font-medium">
                        <tr>
                            <th className="px-4 py-2">Milestone</th>
                            <th className="px-4 py-2 text-right">Target (USD)</th>
                            <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {milestones.map((m, i) => {
                            const achieved = totalNetWorth >= m.target;
                            return (
                                <tr key={i} className={achieved ? 'bg-emerald-900/10' : ''}>
                                    <td className="px-4 py-2 text-slate-300">{m.label}</td>
                                    <td className="px-4 py-2 text-right font-mono text-slate-400">${m.target.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${achieved ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-400'}`}>
                                            {achieved ? 'ACHIEVED' : 'PENDING'}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
           </div>
        </div>

        {/* METRICS (Right) */}
        <div className="lg:col-span-6 space-y-6">
            
            {/* GOAL TRACKING */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h3 className="font-bold text-yellow-500 uppercase tracking-wider text-sm mb-4">Goal Tracking</h3>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-4">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Target Goal (USD):</span>
                        <div className="flex items-center">
                           <span className="mr-1 text-slate-500">$</span>
                           <input 
                                className="bg-transparent text-right font-bold text-blue-400 outline-none w-20 focus:border-b focus:border-blue-500" 
                                value={settings.targetGoal} 
                                onChange={e => updateSettings('targetGoal', parseFloat(e.target.value) || 0)} 
                           />
                        </div>
                    </div>
                     <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Current Net Worth:</span>
                        <span className="font-bold text-blue-400">${totalNetWorth.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Progress %:</span>
                        <span className={`font-bold ${progressPct >= 100 ? 'text-emerald-400' : 'text-emerald-500'}`}>{progressPct.toFixed(2)}%</span>
                    </div>
                     <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Remaining (USD):</span>
                        <span className="font-bold text-blue-400">${Math.max(0, remaining).toLocaleString()}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-1000" style={{ width: `${progressPct}%` }}></div>
                </div>
            </div>

            {/* MONTHLY GROWTH */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                 <h3 className="font-bold text-yellow-500 uppercase tracking-wider text-sm mb-4">Monthly Growth Tracking</h3>
                 
                 <div className="grid grid-cols-1 gap-4 text-sm">
                     <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded border border-slate-800">
                        <span className="text-slate-300">Starting Net Worth (Month):</span>
                        <div className="flex items-center">
                             <span className="mr-1 text-slate-500">$</span>
                             <input 
                                  className="bg-transparent text-right font-mono font-bold text-blue-400 outline-none w-24 focus:border-b focus:border-blue-500" 
                                  value={settings.startNetWorth} 
                                  onChange={e => updateSettings('startNetWorth', parseFloat(e.target.value) || 0)} 
                             />
                        </div>
                    </div>
                     <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Monthly Growth %:</span>
                        <span className={`font-mono font-bold ${monthlyGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowthPct.toFixed(2)}%
                        </span>
                    </div>
                     <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Annualized Growth %:</span>
                        <span className={`font-mono font-bold ${annualizedGrowthPct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                             {annualizedGrowthPct.toFixed(2)}%
                        </span>
                    </div>
                 </div>
            </div>

            {/* EXCHANGE RATE CONFIG */}
             <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Exchange Rate (USD → Local):</span>
                    <input 
                        type="number"
                        className="bg-slate-800 text-right text-slate-200 rounded px-2 py-1 w-24 border border-slate-700 outline-none focus:border-blue-500" 
                        value={settings.exchangeRate} 
                        onChange={e => updateSettings('exchangeRate', parseFloat(e.target.value) || 0)} 
                    />
                 </div>
            </div>

        </div>

      </div>

      {/* BOTTOM SECTION: ALLOCATION ENGINE */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-1">
          {/* Engine Header */}
          <div className="bg-slate-900 p-4 border-b border-slate-800 text-center mb-6">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest">Capital Allocation Engine</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 pb-8">
              
              {/* LEFT COLUMN: CONFIG & CALCS */}
              <div className="space-y-8">
                  
                  {/* CONFIG */}
                  <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                      <h4 className="text-yellow-500 font-bold uppercase text-sm mb-4">Allocation Policy Configuration</h4>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center bg-blue-900/20 p-2 rounded">
                              <label className="text-sm text-slate-300">Betting Capital %</label>
                              <div className="flex items-center text-blue-400 font-bold"><input type="number" className="bg-transparent text-right w-12 outline-none border-b border-transparent focus:border-blue-400" value={policy.bettingSplit} onChange={e => updatePolicy('bettingSplit', e.target.value)} />%</div>
                          </div>
                          <div className="flex justify-between items-center bg-purple-900/20 p-2 rounded">
                              <label className="text-sm text-slate-300">Crypto Reserve %</label>
                              <div className="flex items-center text-blue-400 font-bold"><input type="number" className="bg-transparent text-right w-12 outline-none border-b border-transparent focus:border-blue-400" value={policy.cryptoSplit} onChange={e => updatePolicy('cryptoSplit', e.target.value)} />%</div>
                          </div>
                          <div className="flex justify-between items-center bg-emerald-900/20 p-2 rounded">
                              <label className="text-sm text-slate-300">Cash Reserve %</label>
                              <div className="flex items-center text-blue-400 font-bold"><input type="number" className="bg-transparent text-right w-12 outline-none border-b border-transparent focus:border-blue-400" value={policy.cashSplit} onChange={e => updatePolicy('cashSplit', e.target.value)} />%</div>
                          </div>
                          <div className="flex justify-between items-center bg-rose-900/20 p-2 rounded">
                              <label className="text-sm text-slate-300">Emergency Reserve %</label>
                              <div className="flex items-center text-blue-400 font-bold"><input type="number" className="bg-transparent text-right w-12 outline-none border-b border-transparent focus:border-blue-400" value={policy.emergencySplit} onChange={e => updatePolicy('emergencySplit', e.target.value)} />%</div>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                              <label className="text-sm font-bold text-slate-200">Total Allocation</label>
                              <div className={`font-bold ${totalPolicy === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>{totalPolicy}%</div>
                          </div>
                          {totalPolicy !== 100 && <p className="text-xs text-rose-400 text-right">Must equal 100%</p>}
                      </div>
                  </div>

                  {/* PROFIT CALC */}
                  <div>
                      <h4 className="text-yellow-500 font-bold uppercase text-sm mb-4">Profit Calculations</h4>
                      <div className="bg-slate-900 p-4 rounded-lg space-y-2 border border-slate-800">
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Current Bankroll (USD):</span>
                              <span className="font-mono text-blue-400">${bettingBankroll.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Starting Capital (USD):</span>
                              <span className="font-mono text-blue-400">${startingCapital.toFixed(0)}</span>
                          </div>
                           <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                              <span className="text-slate-200 font-bold">Total Profit (USD):</span>
                              <span className={`font-mono font-bold ${bettingProfit >= 0 ? 'text-emerald-400' : 'text-emerald-500'}`}>
                                  {bettingProfit >= 0 ? '+' : ''}${bettingProfit.toFixed(0)}
                              </span>
                          </div>
                      </div>
                  </div>

                   {/* BREAKDOWN TABLE */}
                  <div>
                      <h4 className="text-yellow-500 font-bold uppercase text-sm mb-4">Allocation Breakdown</h4>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs">
                              <thead className="bg-slate-800 text-slate-500 uppercase">
                                  <tr>
                                      <th className="px-4 py-2">Category</th>
                                      <th className="px-4 py-2 text-center">Percent</th>
                                      <th className="px-4 py-2 text-right">USD</th>
                                      <th className="px-4 py-2 text-right">Local ({settings.exchangeRate})</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 text-slate-300">
                                  <tr>
                                      <td className="px-4 py-2">Betting Capital</td>
                                      <td className="px-4 py-2 text-center text-blue-400">{policy.bettingSplit}%</td>
                                      <td className="px-4 py-2 text-right font-mono text-blue-300">${calcAlloc(policy.bettingSplit).toFixed(0)}</td>
                                      <td className="px-4 py-2 text-right font-mono text-slate-400">{(calcAlloc(policy.bettingSplit) * settings.exchangeRate).toLocaleString()}</td>
                                  </tr>
                                   <tr>
                                      <td className="px-4 py-2">Crypto Reserve</td>
                                      <td className="px-4 py-2 text-center text-blue-400">{policy.cryptoSplit}%</td>
                                      <td className="px-4 py-2 text-right font-mono text-blue-300">${calcAlloc(policy.cryptoSplit).toFixed(0)}</td>
                                      <td className="px-4 py-2 text-right font-mono text-slate-400">{(calcAlloc(policy.cryptoSplit) * settings.exchangeRate).toLocaleString()}</td>
                                  </tr>
                                   <tr>
                                      <td className="px-4 py-2">Cash Reserve</td>
                                      <td className="px-4 py-2 text-center text-blue-400">{policy.cashSplit}%</td>
                                      <td className="px-4 py-2 text-right font-mono text-blue-300">${calcAlloc(policy.cashSplit).toFixed(0)}</td>
                                      <td className="px-4 py-2 text-right font-mono text-slate-400">{(calcAlloc(policy.cashSplit) * settings.exchangeRate).toLocaleString()}</td>
                                  </tr>
                                   <tr>
                                      <td className="px-4 py-2">Emergency Reserve</td>
                                      <td className="px-4 py-2 text-center text-blue-400">{policy.emergencySplit}%</td>
                                      <td className="px-4 py-2 text-center text-blue-400">{policy.emergencySplit}%</td>
                                      <td className="px-4 py-2 text-right font-mono text-blue-300">${calcAlloc(policy.emergencySplit).toFixed(0)}</td>
                                      <td className="px-4 py-2 text-right font-mono text-slate-400">{(calcAlloc(policy.emergencySplit) * settings.exchangeRate).toLocaleString()}</td>
                                  </tr>
                                  <tr className="bg-slate-800/50 font-bold">
                                      <td className="px-4 py-2 text-white">TOTAL</td>
                                      <td className="px-4 py-2 text-center text-white">100%</td>
                                      <td className="px-4 py-2 text-right font-mono text-white">${bettingProfit.toFixed(0)}</td>
                                      <td className="px-4 py-2 text-right font-mono text-white">{(bettingProfit * settings.exchangeRate).toLocaleString()}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>

              </div>

              {/* RIGHT COLUMN: STRATEGY & SCHEDULE */}
              <div className="space-y-8">
                  
                  {/* REINVESTMENT */}
                  <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                      <h4 className="text-yellow-500 font-bold uppercase text-sm mb-4">Reinvestment Strategy</h4>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center bg-blue-900/20 p-2 rounded">
                              <label className="text-sm text-slate-300">Auto-Reinvest Profits:</label>
                              <select 
                                className="bg-slate-800 text-blue-400 font-bold rounded px-2 py-1 outline-none border border-slate-700"
                                value={settings.autoReinvest ? 'YES' : 'NO'}
                                onChange={e => updateSettings('autoReinvest', e.target.value === 'YES')}
                              >
                                  <option value="YES">YES</option>
                                  <option value="NO">NO</option>
                              </select>
                          </div>
                           <div className="flex justify-between items-center">
                              <label className="text-sm text-slate-300">Reinvestment Threshold:</label>
                              <div className="flex items-center text-blue-400 font-bold">
                                  $ <input type="number" className="bg-transparent text-right w-20 outline-none border-b border-transparent focus:border-blue-400" value={settings.reinvestThreshold} onChange={e => updateSettings('reinvestThreshold', parseFloat(e.target.value))} />
                              </div>
                          </div>
                           <div className="flex justify-between items-center">
                              <label className="text-sm text-slate-300">Compounding Frequency:</label>
                              <select 
                                className="bg-slate-900 text-blue-400 font-bold rounded px-2 py-1 outline-none text-right"
                                value={settings.frequency}
                                onChange={e => updateSettings('frequency', e.target.value)}
                              >
                                  <option value="Daily">Daily</option>
                                  <option value="Weekly">Weekly</option>
                                  <option value="Monthly">Monthly</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  {/* SCHEDULE */}
                  <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-yellow-500 font-bold uppercase text-sm">Monthly Allocation Schedule</h4>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-2 py-1">
                            <button onClick={() => setCurrentYear(y => y - 1)} className="text-slate-400 hover:text-white"><ChevronLeft size={16} /></button>
                            <span className="text-sm font-bold font-mono text-blue-400">{currentYear}</span>
                            <button onClick={() => setCurrentYear(y => y + 1)} className="text-slate-400 hover:text-white"><ChevronRight size={16} /></button>
                        </div>
                      </div>
                      
                      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                           <table className="w-full text-left text-xs">
                              <thead className="bg-slate-950 text-yellow-500 uppercase border-b border-slate-800">
                                  <tr>
                                      <th className="px-4 py-3 font-bold">Month</th>
                                      <th className="px-4 py-3 text-right font-bold">Amount (USD)</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 text-slate-400">
                                  {getYearSchedule(currentYear).map((amount, i) => (
                                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                          <td className="px-4 py-2.5 text-slate-300">Month {i + 1}</td>
                                          <td className="px-4 py-2.5 text-right font-mono text-blue-400">
                                              <div className="flex justify-end items-center group">
                                                <span className="text-slate-600 mr-1">$</span>
                                                <input 
                                                    type="number" 
                                                    value={amount} 
                                                    onChange={(e) => updateSchedule(currentYear, i, e.target.value)}
                                                    className="bg-transparent text-right w-24 outline-none text-blue-400 group-hover:text-blue-300 font-bold"
                                                />
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                           </table>
                      </div>
                      
                      {/* CROSS REFERENCE METRIC */}
                      <div className="mt-3 flex justify-between items-center px-2">
                           <p className="text-[10px] text-slate-600 italic">* Manual entry for tracking distributed profits.</p>
                           <div className="flex items-center gap-2 text-xs">
                               <span className="text-slate-500">Unallocated Profit:</span>
                               <span className={`font-mono font-bold ${unallocatedProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                                   ${unallocatedProfit.toLocaleString()}
                               </span>
                               <div className="text-slate-600 text-[10px]">(Profit - Total Distributed)</div>
                           </div>
                      </div>
                  </div>

              </div>

          </div>
      </div>

    </div>
  );
};

export default CapitalAllocation;