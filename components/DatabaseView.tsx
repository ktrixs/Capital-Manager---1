import React, { useEffect, useState } from 'react';
import { generatePythonCode } from '../services/geminiService';
import { Database, Code, Copy, Loader2, Coins, PieChart } from 'lucide-react';

const DatabaseView: React.FC = () => {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate the schema code on mount if not already done
    const fetchSchema = async () => {
      setLoading(true);
      const generated = await generatePythonCode("Database Schema using SQLAlchemy for Matches, Bets, Allocation, and Cycles");
      setCode(generated);
      setLoading(false);
    };
    fetchSchema();
  }, []);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Database Schema Design</h2>
          <p className="text-slate-400 text-sm">PostgreSQL relational structure for data integrity.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
            >
                <Code size={16} /> Generate Migration Script
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Visual Schema Representation */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-2">
            
            {/* CORE BETTING */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-500 font-bold font-mono mb-3 pb-2 border-b border-slate-700">
                    <Database size={16} /> Table: bets
                </div>
                <ul className="text-sm font-mono space-y-2 text-slate-300">
                    <li className="flex justify-between"><span>id</span> <span className="text-slate-500">UUID (PK)</span></li>
                    <li className="flex justify-between"><span>match_id</span> <span className="text-slate-500">UUID (FK)</span></li>
                    <li className="flex justify-between"><span>stake</span> <span className="text-slate-500">DECIMAL</span></li>
                    <li className="flex justify-between"><span>odds</span> <span className="text-slate-500">DECIMAL</span></li>
                    <li className="flex justify-between"><span>result</span> <span className="text-slate-500">ENUM</span></li>
                    <li className="flex justify-between"><span>sport</span> <span className="text-slate-500">VARCHAR</span></li>
                </ul>
            </div>

            {/* CAPITAL ALLOCATION */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono mb-3 pb-2 border-b border-slate-700">
                    <PieChart size={16} /> Table: allocation_ledger
                </div>
                <ul className="text-sm font-mono space-y-2 text-slate-300">
                    <li className="flex justify-between"><span>id</span> <span className="text-slate-500">BIGINT (PK)</span></li>
                    <li className="flex justify-between"><span>year</span> <span className="text-slate-500">INT</span></li>
                    <li className="flex justify-between"><span>month</span> <span className="text-slate-500">INT</span></li>
                    <li className="flex justify-between"><span>amount_usd</span> <span className="text-slate-500">DECIMAL</span></li>
                    <li className="flex justify-between"><span>note</span> <span className="text-slate-500">TEXT</span></li>
                    <li className="flex justify-between"><span>created_at</span> <span className="text-slate-500">TIMESTAMP</span></li>
                </ul>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono mb-3 pb-2 border-b border-slate-700">
                    <PieChart size={16} /> Table: asset_snapshots
                </div>
                <ul className="text-sm font-mono space-y-2 text-slate-300">
                    <li className="flex justify-between"><span>id</span> <span className="text-slate-500">BIGINT (PK)</span></li>
                    <li className="flex justify-between"><span>crypto_val</span> <span className="text-slate-500">DECIMAL</span></li>
                    <li className="flex justify-between"><span>real_estate_val</span> <span className="text-slate-500">DECIMAL</span></li>
                    <li className="flex justify-between"><span>cash_val</span> <span className="text-slate-500">DECIMAL</span></li>
                    <li className="flex justify-between"><span>recorded_at</span> <span className="text-slate-500">TIMESTAMP</span></li>
                </ul>
            </div>

            {/* CYCLES */}
             <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold font-mono mb-3 pb-2 border-b border-slate-700">
                    <Coins size={16} /> Table: cycle_sessions
                </div>
                <ul className="text-sm font-mono space-y-2 text-slate-300">
                    <li className="flex justify-between"><span>id</span> <span className="text-slate-500">UUID (PK)</span></li>
                    <li className="flex justify-between"><span>start_capital</span> <span className="text-slate-500">DECIMAL</span></li>
                    <li className="flex justify-between"><span>end_bankroll</span> <span className="text-slate-500">DECIMAL</span></li>
                    <li className="flex justify-between"><span>status</span> <span className="text-slate-500">ENUM</span></li>
                    <li className="flex justify-between"><span>steps_completed</span> <span className="text-slate-500">INT</span></li>
                </ul>
            </div>
        </div>

        {/* Generated Code Area */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">schema.py (SQLAlchemy)</span>
                <button className="text-slate-400 hover:text-white"><Copy size={14} /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm text-blue-300 whitespace-pre">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                        <Loader2 className="animate-spin" size={24} /> Generating SQLAlchemy Schema...
                    </div>
                ) : code}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseView;