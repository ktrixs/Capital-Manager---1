import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Percent, Clock, AlertCircle } from 'lucide-react';
import { getBets, getStartingBankroll } from '../services/journalService';
import { calculateStats } from '../utils/analytics';
import { Bet, BetResult } from '../types';

const MetricCard: React.FC<{ title: string; value: string; change?: string; isPositive?: boolean; icon: React.ReactNode }> = ({ title, value, change, isPositive, icon }) => (
  <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-700/50 rounded-lg text-slate-300">
        {icon}
      </div>
      {change && (
        <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {change}
        </div>
      )}
    </div>
    <div className="text-slate-400 text-sm font-medium mb-1">{title}</div>
    <div className="text-2xl font-bold text-slate-100 font-mono">{value}</div>
  </div>
);

const Dashboard: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedBets = getBets();
    const startBank = getStartingBankroll();
    setBets(loadedBets);
    if (loadedBets.length > 0) {
        setStats(calculateStats(loadedBets, startBank));
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Loading analytics...</div>;

  if (bets.length === 0) {
    return (
        <div className="animate-fade-in flex flex-col items-center justify-center h-[60vh] text-slate-500 space-y-4 border border-slate-800 rounded-xl bg-slate-900/50 p-8">
            <Activity size={64} className="opacity-20" />
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-300 mb-2">Dashboard Empty</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                    No betting data found. Go to the <strong className="text-blue-400">Betting Journal</strong> to log your first bet and unlock analytics.
                </p>
            </div>
        </div>
    );
  }

  // Derived Real-time Metrics
  const activeExposure = bets.filter(b => b.result === BetResult.PENDING).reduce((sum, b) => sum + b.stake, 0);
  const pendingCount = bets.filter(b => b.result === BetResult.PENDING).length;
  const recentBets = [...bets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  
  // Group Performance by Sport
  const sportsPerformance = Array.from(new Set(bets.map(b => b.sport))).map(sport => {
    const sportBets = bets.filter(b => b.sport === sport && b.result !== BetResult.PENDING);
    const totalStake = sportBets.reduce((sum, b) => sum + b.stake, 0);
    const profit = sportBets.reduce((sum, b) => {
        if(b.result === BetResult.WIN) return sum + (b.stake * b.odds - b.stake);
        if(b.result === BetResult.LOSS) return sum - b.stake;
        if(b.result === BetResult.HALF_WIN) return sum + ((b.stake * b.odds - b.stake) / 2);
        if(b.result === BetResult.HALF_LOSS) return sum - (b.stake / 2);
        return sum;
    }, 0);
    const roi = totalStake > 0 ? (profit / totalStake) * 100 : 0;
    return { sport, profit, roi, count: sportBets.length };
  }).filter(s => s.count > 0).sort((a, b) => b.profit - a.profit);

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Syndicate Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Bankroll" 
          value={`$${stats.currentBankroll.toFixed(2)}`}
          change={`${stats.profit >= 0 ? '+' : ''}${stats.profit.toFixed(2)}`} 
          isPositive={stats.profit >= 0} 
          icon={<DollarSign size={20} />} 
        />
        <MetricCard 
          title="Active Exposure" 
          value={`$${activeExposure.toFixed(2)}`}
          change={`${((activeExposure / stats.currentBankroll) * 100).toFixed(1)}% of Bank`}
          isPositive={true} 
          icon={<Activity size={20} />} 
        />
        <MetricCard 
          title="Yield (ROI)" 
          value={`${stats.roi.toFixed(1)}%`}
          change="All Time"
          isPositive={stats.roi >= 0} 
          icon={<Percent size={20} />} 
        />
        <MetricCard 
          title="Pending Bets" 
          value={pendingCount.toString()}
          icon={<Clock size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Recent Activity</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-xs uppercase font-medium text-slate-500">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Event</th>
                            <th className="px-4 py-3">Selection</th>
                            <th className="px-4 py-3">Stake</th>
                            <th className="px-4 py-3">Odds</th>
                            <th className="px-4 py-3 rounded-tr-lg text-right">P/L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {recentBets.map(bet => {
                             let pl = 0;
                             let plClass = 'text-slate-400';
                             if(bet.result === BetResult.WIN) { pl = (bet.stake * bet.odds) - bet.stake; plClass = 'text-emerald-400'; }
                             else if(bet.result === BetResult.LOSS) { pl = -bet.stake; plClass = 'text-rose-400'; }
                             else if(bet.result === BetResult.HALF_WIN) { pl = ((bet.stake * bet.odds) - bet.stake) / 2; plClass = 'text-emerald-400'; }
                             else if(bet.result === BetResult.HALF_LOSS) { pl = -bet.stake / 2; plClass = 'text-rose-400'; }
                             else if(bet.result === BetResult.PENDING) { plClass = 'text-yellow-400'; }

                             return (
                                <tr key={bet.id}>
                                    <td className="px-4 py-3 font-medium text-slate-200">{bet.match}</td>
                                    <td className="px-4 py-3">{bet.selection}</td>
                                    <td className="px-4 py-3 font-mono">${bet.stake}</td>
                                    <td className="px-4 py-3 font-mono">{bet.odds.toFixed(2)}</td>
                                    <td className={`px-4 py-3 font-mono text-right font-bold ${plClass}`}>
                                        {bet.result === BetResult.PENDING ? 'PENDING' : `${pl >= 0 ? '+' : ''}${pl.toFixed(2)}`}
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Performance by Sport</h3>
            {sportsPerformance.length === 0 ? (
                <div className="text-slate-500 text-sm">No settled bets to analyze.</div>
            ) : (
                <div className="space-y-4">
                    {sportsPerformance.map(item => (
                        <div key={item.sport}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">{item.sport} <span className="text-xs text-slate-600">({item.count})</span></span>
                                <span className={`${item.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono`}>
                                    {item.profit >= 0 ? '+' : ''}{item.profit.toFixed(2)} ({item.roi.toFixed(1)}% ROI)
                                </span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2">
                                <div 
                                    className={`${item.roi >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} h-2 rounded-full`} 
                                    style={{width: `${Math.min(Math.abs(item.roi) * 2, 100)}%`}}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;