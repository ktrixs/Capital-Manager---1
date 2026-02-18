import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, TrendingUp, DollarSign, Activity, Filter, Download, Edit2, Table, Calendar, Target, CheckCircle, ChevronRight } from 'lucide-react';
import { Bet, BetResult, ConfidenceLevel } from '../types';
import { getBets, saveBet, deleteBet, getStartingBankroll, saveStartingBankroll } from '../services/journalService';
import { calculateStats, generateBankrollChartData } from '../utils/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const BettingJournal: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [view, setView] = useState<'LIST' | 'ANALYTICS'>('LIST');
  const [showForm, setShowForm] = useState(false);
  const [initialBankroll, setInitialBankroll] = useState(10000);
  
  // Bankroll Edit State
  const [isEditingBankroll, setIsEditingBankroll] = useState(false);
  const [editBankrollValue, setEditBankrollValue] = useState('');

  // Form State
  const [formTab, setFormTab] = useState<'DETAILS' | 'ODDS' | 'RESULT'>('DETAILS');
  const emptyBet: Bet = {
    id: '',
    date: new Date().toISOString().split('T')[0],
    sport: 'Football',
    league: '',
    match: '',
    selection: '',
    odds: 2.00,
    stake: 100,
    result: BetResult.PENDING,
    bookmaker: '',
    confidence: ConfidenceLevel.MEDIUM,
    marketType: 'Match Winner',
    emotionalState: 'Calm',
    notes: ''
  };
  const [formData, setFormData] = useState<Bet>(emptyBet);

  useEffect(() => {
    setBets(getBets());
    setInitialBankroll(getStartingBankroll());
  }, []);

  const stats = calculateStats(bets, initialBankroll);
  const chartData = generateBankrollChartData(bets, initialBankroll);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const betToSave = { ...formData, id: formData.id || crypto.randomUUID() };
    const updatedBets = saveBet(betToSave);
    setBets(updatedBets);
    setShowForm(false);
    setFormData(emptyBet);
    setFormTab('DETAILS'); // Reset tab
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this bet record?')) {
        const updated = deleteBet(id);
        setBets(updated);
    }
  };

  const handleEdit = (bet: Bet) => {
    setFormData({
        ...emptyBet, // ensure new fields exist if editing old records
        ...bet
    });
    setFormTab('DETAILS');
    setShowForm(true);
  };

  const handleSaveBankroll = () => {
    const val = parseFloat(editBankrollValue);
    if (!isNaN(val) && val >= 0) {
      saveStartingBankroll(val);
      setInitialBankroll(val);
      setIsEditingBankroll(false);
    }
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bets));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "betting_journal.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Helper for Pivot Tables
  const calculateSegmentStats = (segmentBets: Bet[]) => {
    const settled = segmentBets.filter(b => b.result !== BetResult.PENDING);
    if (settled.length === 0) return { bets: 0, wins: 0, winRate: 0, profit: 0, avgOdds: 0 };
    
    let profit = 0;
    let wins = 0;
    let totalOdds = 0;

    settled.forEach(b => {
        totalOdds += b.odds;
        if (b.result === BetResult.WIN) {
            profit += (b.stake * b.odds) - b.stake;
            wins++;
        } else if (b.result === BetResult.LOSS) {
            profit -= b.stake;
        } else if (b.result === BetResult.HALF_WIN) {
            profit += ((b.stake * b.odds) - b.stake) / 2;
            wins += 0.5;
        } else if (b.result === BetResult.HALF_LOSS) {
            profit -= b.stake / 2;
        }
    });

    return {
        bets: settled.length,
        wins: wins,
        winRate: (wins / settled.length) * 100,
        profit: profit,
        avgOdds: totalOdds / settled.length
    };
  };

  const renderPivotTable = (title: string, data: any[], columns: { label: string, key: string, format?: (v: any) => React.ReactNode }[]) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-700 font-bold text-yellow-500 text-sm uppercase tracking-wider">
            {title}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-500 font-medium border-b border-slate-700">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className={`px-3 py-2 ${i > 0 ? 'text-right' : ''}`}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-700/20">
                            {columns.map((col, j) => (
                                <td key={j} className={`px-3 py-2 text-slate-300 ${j > 0 ? 'text-right' : ''}`}>
                                    {col.format ? col.format(row[col.key]) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan={columns.length} className="px-3 py-4 text-center text-slate-600">No Data</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
  );

  // Group Data for Pivots
  const getGroupedData = (key: keyof Bet | 'oddsRange') => {
    const groups: Record<string, Bet[]> = {};
    
    bets.forEach(bet => {
        let groupKey = '';
        if (key === 'oddsRange') {
            const o = bet.odds;
            if (o < 1.50) groupKey = '1.01 - 1.49';
            else if (o < 2.00) groupKey = '1.50 - 1.99';
            else if (o < 2.50) groupKey = '2.00 - 2.49';
            else if (o < 3.00) groupKey = '2.50 - 2.99';
            else if (o < 4.00) groupKey = '3.00 - 3.99';
            else groupKey = '4.00+';
        } else {
            groupKey = (bet[key] as string) || 'Unknown';
        }

        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(bet);
    });

    return Object.keys(groups).map(g => {
        const s = calculateSegmentStats(groups[g]);
        return { label: g, ...s };
    }).sort((a, b) => b.bets - a.bets); // Sort by volume
  };

  // Helper for Stake Distribution Chart
  const getStakeDistribution = () => {
    const ranges = [
      { label: '<$50', max: 50, count: 0 },
      { label: '$50-100', max: 100, count: 0 },
      { label: '$101-250', max: 250, count: 0 },
      { label: '$251-500', max: 500, count: 0 },
      { label: '$501-1k', max: 1000, count: 0 },
      { label: '$1k+', max: Infinity, count: 0 }
    ];

    bets.forEach(bet => {
        if (bet.stake <= 50) ranges[0].count++;
        else if (bet.stake <= 100) ranges[1].count++;
        else if (bet.stake <= 250) ranges[2].count++;
        else if (bet.stake <= 500) ranges[3].count++;
        else if (bet.stake <= 1000) ranges[4].count++;
        else ranges[5].count++;
    });

    return ranges;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-100">Professional Betting Journal</h2>
            <p className="text-slate-400 text-sm">Track, analyze, and optimize your betting performance.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setView('LIST')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'LIST' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Log</button>
            <button onClick={() => setView('ANALYTICS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'ANALYTICS' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Analytics</button>
            <button onClick={exportData} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 transition-colors"><Download size={18} /></button>
            <button onClick={() => { setFormData(emptyBet); setFormTab('DETAILS'); setShowForm(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                <Plus size={16} /> New Bet
            </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 relative group">
            <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-slate-400 uppercase">Bankroll</div>
                <button 
                    onClick={() => {
                        setEditBankrollValue(initialBankroll.toString());
                        setIsEditingBankroll(true);
                    }}
                    className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-blue-400 transition-colors"
                    title="Edit Starting Bankroll"
                >
                    <Edit2 size={14} />
                </button>
            </div>
            <div className="text-xl font-bold font-mono text-white">${stats.currentBankroll.toFixed(2)}</div>
            <div className="text-[10px] text-slate-500 mt-1">Start: ${initialBankroll.toFixed(0)}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 uppercase">Profit</div>
            <div className={`text-xl font-bold font-mono ${stats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}
            </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 uppercase">ROI</div>
            <div className={`text-xl font-bold font-mono ${stats.roi >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {stats.roi.toFixed(2)}%
            </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 uppercase">Win Rate</div>
            <div className="text-xl font-bold font-mono text-yellow-400">{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 uppercase">Max Drawdown</div>
            <div className="text-xl font-bold font-mono text-rose-400">-{stats.maxDrawdown.toFixed(2)}%</div>
        </div>
      </div>

      {/* Edit Bankroll Modal */}
      {isEditingBankroll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Set Starting Bankroll</h3>
                <p className="text-sm text-slate-400 mb-4">Enter your initial capital. All profits and losses will be calculated relative to this amount.</p>
                <input 
                    type="number" 
                    value={editBankrollValue} 
                    onChange={(e) => setEditBankrollValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-mono mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                    placeholder="e.g. 10000"
                />
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => setIsEditingBankroll(false)}
                        className="px-3 py-1.5 rounded text-slate-400 hover:text-white text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveBankroll}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold"
                    >
                        Update Bankroll
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Bet Entry Modal/Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {formData.id ? <Edit2 size={18} className="text-blue-400"/> : <Plus size={18} className="text-blue-400"/>}
                        {formData.id ? 'Edit Bet Record' : 'New Bet Entry'}
                    </h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900">
                    <button
                        type="button"
                        onClick={() => setFormTab('DETAILS')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-2 ${formTab === 'DETAILS' ? 'border-blue-500 text-blue-400 bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Calendar size={14} /> Event Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormTab('ODDS')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-2 ${formTab === 'ODDS' ? 'border-blue-500 text-blue-400 bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <TrendingUp size={14} /> Risk & Return
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormTab('RESULT')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-2 ${formTab === 'RESULT' ? 'border-blue-500 text-blue-400 bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <CheckCircle size={14} /> Settlement
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    
                    {/* DETAILS TAB */}
                    <div className={formTab === 'DETAILS' ? 'block space-y-5' : 'hidden'}>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Date</label>
                                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Sport</label>
                                <div className="relative">
                                    <input required list="sports" value={formData.sport} onChange={e => setFormData({...formData, sport: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    <datalist id="sports"><option value="Football" /><option value="Tennis" /><option value="Basketball" /><option value="MMA" /><option value="Baseball" /><option value="Esports" /></datalist>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1.5">Match / Event</label>
                            <input required type="text" placeholder="e.g. Manchester City vs Liverpool" value={formData.match} onChange={e => setFormData({...formData, match: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">League / Tournament</label>
                                <input type="text" placeholder="e.g. Premier League" value={formData.league} onChange={e => setFormData({...formData, league: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Bookmaker</label>
                                <input type="text" placeholder="e.g. Pinnacle" value={formData.bookmaker} onChange={e => setFormData({...formData, bookmaker: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-800 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-blue-400 mb-1.5">Selection (Bet)</label>
                                <input required type="text" placeholder="e.g. Home Win -0.5" value={formData.selection} onChange={e => setFormData({...formData, selection: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Market Type</label>
                                <select value={formData.marketType} onChange={e => setFormData({...formData, marketType: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                    <option value="Match Winner">Match Winner (1X2)</option>
                                    <option value="Asian Handicap">Asian Handicap</option>
                                    <option value="Over/Under">Over/Under</option>
                                    <option value="BTTS">Both Teams Score</option>
                                    <option value="Prop">Player Prop</option>
                                    <option value="Futures">Futures/Outright</option>
                                    <option value="Parlay">Parlay/Combo</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ODDS TAB */}
                    <div className={formTab === 'ODDS' ? 'block space-y-6' : 'hidden'}>
                        <div className="bg-slate-800/50 p-5 rounded-lg border border-slate-700">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Target size={16} className="text-emerald-400"/> Position Sizing</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Decimal Odds</label>
                                    <div className="relative">
                                        <input required type="number" step="0.01" value={formData.odds} onChange={e => setFormData({...formData, odds: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-3 pr-3 py-3 text-xl font-mono font-bold text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                                    </div>
                                    <div className="mt-1 text-right text-[10px] text-slate-500">Implied: {formData.odds > 0 ? (100/formData.odds).toFixed(1) : 0}%</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Stake Amount ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3.5 text-slate-500">$</span>
                                        <input required type="number" step="1" value={formData.stake} onChange={e => setFormData({...formData, stake: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-7 pr-3 py-3 text-xl font-mono font-bold text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="mt-1 text-right text-[10px] text-slate-500">
                                        {((formData.stake / initialBankroll) * 100).toFixed(2)}% of Bank
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400">Confidence Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[ConfidenceLevel.LOW, ConfidenceLevel.MEDIUM, ConfidenceLevel.HIGH].map((level) => (
                                    <button
                                        type="button"
                                        key={level}
                                        onClick={() => setFormData({...formData, confidence: level})}
                                        className={`py-3 rounded-lg text-sm font-bold border transition-all ${
                                            formData.confidence === level 
                                                ? level === 'High' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                                : level === 'Medium' ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                : 'bg-slate-700 border-slate-500 text-slate-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-900/30 flex justify-between items-center">
                            <div>
                                <div className="text-xs text-blue-300 uppercase font-bold mb-1">Potential Return</div>
                                <div className="text-2xl font-mono font-bold text-blue-400">${(formData.stake * formData.odds).toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-emerald-400 uppercase font-bold mb-1">Potential Profit</div>
                                <div className="text-xl font-mono font-bold text-emerald-400">+${((formData.stake * formData.odds) - formData.stake).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                     {/* RESULT TAB */}
                     <div className={formTab === 'RESULT' ? 'block space-y-6' : 'hidden'}>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">Bet Result</label>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                 <button type="button" onClick={() => setFormData({...formData, result: BetResult.WIN})} className={`py-3 rounded-lg font-bold border ${formData.result === BetResult.WIN ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>WIN</button>
                                 <button type="button" onClick={() => setFormData({...formData, result: BetResult.LOSS})} className={`py-3 rounded-lg font-bold border ${formData.result === BetResult.LOSS ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>LOSS</button>
                                 <button type="button" onClick={() => setFormData({...formData, result: BetResult.PENDING})} className={`py-3 rounded-lg font-bold border ${formData.result === BetResult.PENDING ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>PENDING</button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <button type="button" onClick={() => setFormData({...formData, result: BetResult.HALF_WIN})} className={`py-2 text-xs rounded-lg font-bold border ${formData.result === BetResult.HALF_WIN ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>HALF WIN</button>
                                <button type="button" onClick={() => setFormData({...formData, result: BetResult.HALF_LOSS})} className={`py-2 text-xs rounded-lg font-bold border ${formData.result === BetResult.HALF_LOSS ? 'bg-rose-900/30 border-rose-700 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>HALF LOSS</button>
                                <button type="button" onClick={() => setFormData({...formData, result: BetResult.PUSH})} className={`py-2 text-xs rounded-lg font-bold border ${formData.result === BetResult.PUSH ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>PUSH / VOID</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">Emotional State</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {['Calm', 'Confident', 'Excited', 'Tired', 'Frustrated', 'Chasing Losses'].map(state => (
                                    <button
                                        type="button"
                                        key={state}
                                        onClick={() => setFormData({...formData, emotionalState: state})}
                                        className={`px-3 py-2 text-xs rounded border transition-colors ${
                                            formData.emotionalState === state 
                                            ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                                        }`}
                                    >
                                        {state}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1.5">Journal Notes</label>
                            <textarea 
                                value={formData.notes} 
                                onChange={e => setFormData({...formData, notes: e.target.value})} 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                                placeholder="Strategy, reasoning, or post-match review..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Hidden Submit Button to handle Enter key in input fields across tabs */}
                    <button type="submit" className="hidden" />

                </form>

                <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
                    <div className="flex gap-2">
                         {formTab !== 'DETAILS' && (
                            <button 
                                type="button" 
                                onClick={() => setFormTab(prev => prev === 'RESULT' ? 'ODDS' : 'DETAILS')}
                                className="px-4 py-2 rounded text-slate-400 hover:text-white text-sm font-medium transition-colors"
                            >
                                Back
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded text-slate-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
                        
                        {formTab === 'RESULT' ? (
                             <button 
                                onClick={() => handleSubmit()} 
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all transform active:scale-95"
                            >
                                <Save size={16} /> Save Record
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                onClick={() => setFormTab(prev => prev === 'DETAILS' ? 'ODDS' : 'RESULT')}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all"
                            >
                                Next Step <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main View Area */}
      {view === 'LIST' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-800 text-xs uppercase font-medium text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Sport/League</th>
                            <th className="px-4 py-3">Event</th>
                            <th className="px-4 py-3">Bet</th>
                            <th className="px-4 py-3 text-right">Odds</th>
                            <th className="px-4 py-3 text-right">Stake</th>
                            <th className="px-4 py-3 text-center">Result</th>
                            <th className="px-4 py-3 text-right">P/L</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {bets.length === 0 ? (
                            <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-600">No bets recorded yet. Click "New Bet" to start.</td></tr>
                        ) : (
                            bets.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(bet => {
                                let pl = 0;
                                let plClass = 'text-slate-400';
                                if(bet.result === BetResult.WIN) { pl = (bet.stake * bet.odds) - bet.stake; plClass = 'text-emerald-400'; }
                                else if(bet.result === BetResult.LOSS) { pl = -bet.stake; plClass = 'text-rose-400'; }
                                else if(bet.result === BetResult.HALF_WIN) { pl = ((bet.stake * bet.odds) - bet.stake) / 2; plClass = 'text-emerald-400'; }
                                else if(bet.result === BetResult.HALF_LOSS) { pl = -bet.stake / 2; plClass = 'text-rose-400'; }

                                return (
                                    <tr key={bet.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">{bet.date}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-200">{bet.sport}</div>
                                            <div className="text-xs text-slate-600">{bet.league}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{bet.match}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-blue-300">{bet.selection}</span>
                                                <span className="text-[10px] text-slate-600">{bet.marketType}</span>
                                            </div>
                                            {bet.confidence === 'High' && <span className="ml-2 text-[10px] bg-blue-900/30 text-blue-400 px-1 rounded border border-blue-900/50">H</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">{bet.odds.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-300">${bet.stake}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs px-2 py-1 rounded font-bold ${
                                                bet.result === 'WIN' ? 'bg-emerald-900/20 text-emerald-400' :
                                                bet.result === 'LOSS' ? 'bg-rose-900/20 text-rose-400' :
                                                bet.result === 'PENDING' ? 'bg-yellow-900/20 text-yellow-400' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>{bet.result}</span>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-mono font-bold ${plClass}`}>
                                            {bet.result === 'PENDING' ? '-' : `${pl >= 0 ? '+' : ''}${pl.toFixed(2)}`}
                                        </td>
                                        <td className="px-4 py-3 text-center flex justify-center gap-2">
                                            <button onClick={() => handleEdit(bet)} className="p-1 hover:text-blue-400 text-slate-500"><Save size={14}/></button>
                                            <button onClick={() => handleDelete(bet.id)} className="p-1 hover:text-rose-400 text-slate-500"><Trash2 size={14}/></button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Bankroll Growth</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#475569" hide />
                                <YAxis stroke="#475569" domain={['auto', 'auto']} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Line type="stepAfter" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                     <h3 className="text-lg font-bold text-slate-200 mb-4">Stake Distribution</h3>
                     <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getStakeDistribution()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="label" stroke="#475569" tick={{fontSize: 10}} />
                                <YAxis stroke="#475569" allowDecimals={false} />
                                <Tooltip 
                                    cursor={{fill: '#1e293b'}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Bets Placed" />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>
            
            {/* STRATEGY PERFORMANCE SEGMENTATION - PIVOT FRAMEWORK */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Table className="text-blue-400" size={24}/>
                    STRATEGY PERFORMANCE SEGMENTATION - PIVOT FRAMEWORK
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Performance by Sport */}
                    {renderPivotTable("PERFORMANCE BY SPORT", getGroupedData('sport'), [
                        { label: 'Sport', key: 'label' },
                        { label: 'Bets', key: 'bets' },
                        { label: 'Wins', key: 'wins' },
                        { label: 'Win Rate', key: 'winRate', format: v => `${v.toFixed(2)}%` },
                        { label: 'Profit', key: 'profit', format: v => <span className={v >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{v >= 0 ? '+' : ''}{v.toFixed(0)}</span> }
                    ])}

                    {/* Performance by Market */}
                    {renderPivotTable("PERFORMANCE BY MARKET", getGroupedData('marketType'), [
                        { label: 'Market Type', key: 'label' },
                        { label: 'Bets', key: 'bets' },
                        { label: 'Win Rate', key: 'winRate', format: v => `${v.toFixed(2)}%` },
                        { label: 'Avg Odds', key: 'avgOdds', format: v => v.toFixed(2) },
                        { label: 'Profit', key: 'profit', format: v => <span className={v >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{v >= 0 ? '+' : ''}{v.toFixed(0)}</span> }
                    ])}

                     {/* Performance by Odds Range */}
                    {renderPivotTable("PERFORMANCE BY ODDS RANGE", getGroupedData('oddsRange'), [
                        { label: 'Odds Range', key: 'label' },
                        { label: 'Bets', key: 'bets' },
                        { label: 'Win Rate', key: 'winRate', format: v => `${v.toFixed(2)}%` },
                        { label: 'Profit', key: 'profit', format: v => <span className={v >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{v >= 0 ? '+' : ''}{v.toFixed(0)}</span> }
                    ])}

                    {/* Performance by Confidence */}
                    {renderPivotTable("PERFORMANCE BY CONFIDENCE", getGroupedData('confidence'), [
                        { label: 'Confidence', key: 'label' },
                        { label: 'Bets', key: 'bets' },
                        { label: 'Win Rate', key: 'winRate', format: v => `${v.toFixed(2)}%` },
                        { label: 'Profit', key: 'profit', format: v => <span className={v >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{v >= 0 ? '+' : ''}{v.toFixed(0)}</span> }
                    ])}

                    {/* Performance by Emotional State */}
                    {renderPivotTable("PERFORMANCE BY EMOTIONAL STATE", getGroupedData('emotionalState'), [
                        { label: 'Emotional State', key: 'label' },
                        { label: 'Bets', key: 'bets' },
                        { label: 'Win Rate', key: 'winRate', format: v => `${v.toFixed(2)}%` },
                        { label: 'Profit', key: 'profit', format: v => <span className={v >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{v >= 0 ? '+' : ''}{v.toFixed(0)}</span> }
                    ])}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BettingJournal;