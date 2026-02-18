import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, XCircle, CheckCircle, AlertTriangle, TrendingUp, History, Trash2 } from 'lucide-react';
import { LadderStep, CycleState, CycleHistoryItem } from '../types';
import { getCycleState, saveCycleState } from '../services/journalService';

const CycleBetting: React.FC = () => {
  // Configuration State
  const [startCapital, setStartCapital] = useState(100000);
  const [steps, setSteps] = useState(5);
  const [baseOdds, setBaseOdds] = useState(2.00);

  // Cycle State
  const [currentStep, setCurrentStep] = useState(1);
  const [cycleBankroll, setCycleBankroll] = useState(startCapital);
  const [cycleStatus, setCycleStatus] = useState<'IDLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  // Ladder Data
  const [ladder, setLadder] = useState<LadderStep[]>([]);
  const [history, setHistory] = useState<CycleHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state on mount
  useEffect(() => {
    const savedState = getCycleState();
    if (savedState) {
        setStartCapital(savedState.startCapital);
        setSteps(savedState.steps);
        setBaseOdds(savedState.baseOdds);
        setCurrentStep(savedState.currentStep);
        setCycleBankroll(savedState.cycleBankroll);
        setCycleStatus(savedState.cycleStatus);
        setWins(savedState.wins);
        setLosses(savedState.losses);
        setLadder(savedState.ladder);
        setHistory(savedState.history || []);
    }
    setIsLoaded(true);
  }, []);

  // Save state on changes (only after initial load)
  useEffect(() => {
    if (isLoaded) {
        const state: CycleState = {
            startCapital,
            steps,
            baseOdds,
            currentStep,
            cycleBankroll,
            cycleStatus,
            wins,
            losses,
            ladder,
            history
        };
        saveCycleState(state);
    }
  }, [startCapital, steps, baseOdds, currentStep, cycleBankroll, cycleStatus, wins, losses, ladder, history, isLoaded]);

  // Initialize Ladder Projection (only when IDLE and not loaded from persistence)
  useEffect(() => {
    if (isLoaded && cycleStatus === 'IDLE' && ladder.length === 0) {
        generateLadder();
    }
  }, [startCapital, steps, baseOdds, cycleStatus, isLoaded]);

  const generateLadder = () => {
    const newLadder: LadderStep[] = [];
    let currentStake = startCapital;
    
    for (let i = 1; i <= steps; i++) {
        const target = currentStake * baseOdds;
        newLadder.push({
            step: i,
            stake: currentStake,
            target: target,
            status: 'PENDING'
        });
        currentStake = target;
    }
    setLadder(newLadder);
    setCycleBankroll(startCapital);
  };

  // Re-generate ladder if config changes while IDLE
  useEffect(() => {
      if(cycleStatus === 'IDLE' && isLoaded) {
          generateLadder();
      }
  }, [startCapital, steps, baseOdds]);

  const handleStartCycle = () => {
    setCycleStatus('ACTIVE');
    setCurrentStep(1);
    setCycleBankroll(startCapital);
    setWins(0);
    setLosses(0);
    // Reset ladder statuses
    setLadder(prev => prev.map(s => ({ ...s, status: 'PENDING' })));
  };

  const handleReset = (requireConfirmation: boolean = true) => {
    if (requireConfirmation && !window.confirm("Are you sure you want to start a new cycle? Current progress will be archived locally.")) {
        return;
    }
    // If resetting an active cycle manually, we might want to log it as abandoned or failed, 
    // but typically reset just clears the board.
    // If the cycle was already completed/failed, history is already saved in handleResult.
    
    setCycleStatus('IDLE');
    setCurrentStep(1);
    setCycleBankroll(startCapital);
    setWins(0);
    setLosses(0);
    generateLadder();
  };

  const handleResult = (result: 'WIN' | 'LOSS') => {
    if (cycleStatus !== 'ACTIVE') return;

    const currentIdx = currentStep - 1;
    const currentStepData = ladder[currentIdx];

    const updatedLadder = [...ladder];
    let newBankroll = cycleBankroll;

    if (result === 'WIN') {
        updatedLadder[currentIdx].status = 'WIN';
        setWins(w => w + 1);
        newBankroll = currentStepData.target;
        setCycleBankroll(newBankroll);
        
        if (currentStep < steps) {
            setCurrentStep(s => s + 1);
        } else {
            setCycleStatus('COMPLETED');
            // Log History - Completed
            const item: CycleHistoryItem = {
                id: crypto.randomUUID(),
                date: new Date().toISOString().split('T')[0],
                startCapital: startCapital,
                endBankroll: newBankroll,
                profit: newBankroll - startCapital,
                status: 'COMPLETED',
                stepsCompleted: steps,
                totalSteps: steps
            };
            setHistory(prev => [item, ...prev]);
        }
    } else {
        updatedLadder[currentIdx].status = 'LOSS';
        setLosses(l => l + 1);
        newBankroll = 0;
        setCycleBankroll(0);
        setCycleStatus('FAILED');
        
        // Log History - Failed
        const item: CycleHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            startCapital: startCapital,
            endBankroll: 0,
            profit: -startCapital,
            status: 'FAILED',
            stepsCompleted: currentStep - 1,
            totalSteps: steps
        };
        setHistory(prev => [item, ...prev]);
    }

    setLadder(updatedLadder);
  };

  const clearHistory = () => {
      if(window.confirm('Clear all cycle history?')) {
          setHistory([]);
      }
  };

  // Calculations
  const targetMultiplier = Math.pow(baseOdds, steps);
  const targetProfit = (startCapital * targetMultiplier) - startCapital;
  const currentProfit = cycleBankroll - startCapital;
  const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;

  if (!isLoaded) return <div className="p-8 text-slate-400">Loading Cycle Engine...</div>;

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="text-yellow-500" size={32} />
            <div>
                <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-wide">Cycle / Ladder Betting Engine</h2>
                <p className="text-slate-400 text-xs">Exponential growth strategy calculator. <span className="text-slate-500">Standalone Mode.</span></p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN - CONFIG & STATUS */}
            <div className="lg:col-span-4 space-y-8">
                
                {/* CONFIGURATION */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2">Cycle Configuration</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-slate-300 font-medium">Starting Capital</label>
                            <input 
                                type="number" 
                                value={startCapital}
                                onChange={(e) => setStartCapital(Number(e.target.value))}
                                disabled={cycleStatus !== 'IDLE'}
                                className="bg-blue-900/20 border border-blue-800 rounded px-3 py-1.5 text-right font-mono text-blue-100 w-32 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                            />
                        </div>
                         <div className="flex justify-between items-center">
                            <label className="text-sm text-slate-300 font-medium">Number of Steps</label>
                            <input 
                                type="number" 
                                value={steps}
                                onChange={(e) => setSteps(Number(e.target.value))}
                                disabled={cycleStatus !== 'IDLE'}
                                className="bg-blue-900/20 border border-blue-800 rounded px-3 py-1.5 text-right font-mono text-blue-100 w-32 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                            />
                        </div>
                         <div className="flex justify-between items-center">
                            <label className="text-sm text-slate-300 font-medium">Base Odds</label>
                            <input 
                                type="number" step="0.01"
                                value={baseOdds}
                                onChange={(e) => setBaseOdds(Number(e.target.value))}
                                disabled={cycleStatus !== 'IDLE'}
                                className="bg-blue-900/20 border border-blue-800 rounded px-3 py-1.5 text-right font-mono text-blue-100 w-32 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                            />
                        </div>
                        
                        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Target Multiplier</div>
                                <div className="text-lg font-mono text-slate-200">{targetMultiplier.toFixed(2)}x</div>
                            </div>
                             <div className="text-right">
                                <div className="text-xs text-slate-500 mb-1">Target Profit</div>
                                <div className="text-lg font-mono text-emerald-400">+ {targetProfit.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {cycleStatus === 'IDLE' ? (
                        <button onClick={handleStartCycle} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                            <Play size={16} /> Start Cycle
                        </button>
                    ) : cycleStatus === 'ACTIVE' ? (
                         <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                             <p className="text-xs text-slate-400 mb-2">Cycle in progress...</p>
                             <button onClick={() => handleReset(true)} className="text-xs text-slate-500 hover:text-white underline transition-colors">
                                Reset Engine
                             </button>
                         </div>
                    ) : (
                        <button onClick={() => handleReset(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                            <RefreshCw size={16} /> Start New Cycle
                        </button>
                    )}
                </div>

                {/* STATUS */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2">Cycle Status</h3>
                    
                     <div className="flex justify-between items-center">
                        <label className="text-sm text-slate-300 font-medium">Current Step</label>
                        <div className="bg-slate-800 px-4 py-1 rounded text-blue-400 font-mono font-bold">
                            {cycleStatus === 'IDLE' ? '-' : cycleStatus === 'COMPLETED' ? 'DONE' : cycleStatus === 'FAILED' ? 'BUST' : currentStep}
                        </div>
                    </div>
                     <div className="flex justify-between items-center">
                        <label className="text-sm text-slate-300 font-medium">Cycle Bankroll</label>
                        <div className="text-xl font-mono font-bold text-white">
                            {cycleBankroll.toLocaleString()}
                        </div>
                    </div>
                     <div className="flex justify-between items-center">
                        <label className="text-sm text-slate-300 font-medium">Status</label>
                        <div className={`text-sm font-bold px-2 py-0.5 rounded ${
                            cycleStatus === 'ACTIVE' ? 'bg-blue-900/30 text-blue-400' :
                            cycleStatus === 'COMPLETED' ? 'bg-emerald-900/30 text-emerald-400' :
                            cycleStatus === 'FAILED' ? 'bg-rose-900/30 text-rose-400' :
                            'bg-slate-800 text-slate-500'
                        }`}>
                            {cycleStatus}
                        </div>
                    </div>
                </div>

                {/* SUMMARY */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2">Cycle Summary</h3>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-slate-400">Total Wins:</div>
                        <div className="text-right text-slate-200 font-mono">{wins}</div>
                        
                        <div className="text-slate-400">Total Losses:</div>
                        <div className="text-right text-slate-200 font-mono">{losses}</div>
                        
                        <div className="text-slate-400">Cycle Win Rate:</div>
                        <div className="text-right text-blue-400 font-mono">{winRate.toFixed(1)}%</div>
                        
                        <div className="text-slate-400 font-bold pt-2">Total Cycle Profit:</div>
                        <div className={`text-right font-mono font-bold pt-2 ${currentProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {currentProfit.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - TABLE */}
            <div className="lg:col-span-8 flex flex-col gap-8">
                 <div>
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4">Ladder Progression Table</h3>
                    
                    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Step</th>
                                    <th className="px-6 py-4 text-right">Stake</th>
                                    <th className="px-6 py-4 text-right">Target</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {ladder.map((row) => (
                                    <tr key={row.step} className={`transition-colors ${
                                        row.status === 'PENDING' && row.step === currentStep && cycleStatus === 'ACTIVE' 
                                            ? 'bg-blue-900/10' 
                                            : 'hover:bg-slate-800/30'
                                    }`}>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-300">
                                            {row.step}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-blue-300">
                                            {row.stake.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-300">
                                            {row.target.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                row.status === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' :
                                                row.status === 'LOSS' ? 'bg-rose-500/20 text-rose-400' :
                                                row.status === 'SKIPPED' ? 'text-slate-600' :
                                                'bg-slate-800 text-slate-500'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {row.step === currentStep && cycleStatus === 'ACTIVE' && (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleResult('LOSS')}
                                                        className="p-1.5 rounded bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 transition-colors"
                                                        title="Mark Loss"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResult('WIN')}
                                                        className="p-1.5 rounded bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 transition-colors"
                                                        title="Mark Win"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>

                 {/* CYCLE HISTORY */}
                 <div>
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                            <History size={16} /> Previous Cycles
                        </h3>
                        {history.length > 0 && (
                            <button onClick={clearHistory} className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors">
                                <Trash2 size={12} /> Clear History
                            </button>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-sm text-slate-500 italic bg-slate-900/50 p-4 rounded border border-slate-800 text-center">
                            No completed cycles yet.
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">Steps</th>
                                        <th className="px-4 py-3 text-right">Start Capital</th>
                                        <th className="px-4 py-3 text-right">End Bankroll</th>
                                        <th className="px-4 py-3 text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {history.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3 text-xs text-slate-400 font-mono">{item.date}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                    item.status === 'COMPLETED' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-slate-300">
                                                {item.stepsCompleted} / {item.totalSteps}
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs font-mono text-slate-400">
                                                {item.startCapital.toLocaleString()}
                                            </td>
                                             <td className="px-4 py-3 text-right text-xs font-mono text-slate-200">
                                                {item.endBankroll.toLocaleString()}
                                            </td>
                                             <td className={`px-4 py-3 text-right text-xs font-mono font-bold ${item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {item.profit > 0 ? '+' : ''}{item.profit.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default CycleBetting;