import React from 'react';
import { Database, Server, BarChart3, Activity, PieChart, ShieldCheck, ArrowRight, Globe, Cpu, BookOpen, Layers } from 'lucide-react';

const ModuleBox: React.FC<{ title: string; icon: React.ReactNode; description: string; color: string }> = ({ title, icon, description, color }) => (
  <div className={`p-4 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-${color}-500 transition-all duration-300 w-full`}>
    <div className={`flex items-center gap-3 mb-2 text-${color}-400`}>
      {icon}
      <h3 className="font-bold text-lg text-slate-100">{title}</h3>
    </div>
    <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
  </div>
);

const Arrow = () => (
  <div className="hidden md:flex flex-col items-center justify-center text-slate-600">
    <ArrowRight size={24} />
  </div>
);

const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-100 mb-4">System Architecture Overview</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          A modular architecture combining automated quant models with manual trading journal capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
        {/* Layer 1: Data */}
        <div className="md:col-span-3 space-y-4">
          <div className="text-xs font-mono uppercase text-slate-500 mb-2 tracking-wider">Layer 1: Input & Data</div>
          <ModuleBox 
            title="Data Pipeline" 
            icon={<Globe size={20} />} 
            description="Automated odds scraping (API) & Manual Bet Entry (Journal)."
            color="blue"
          />
          <ModuleBox 
            title="Persistence" 
            icon={<Database size={20} />} 
            description="Hybrid storage: TimescaleDB for automated feeds, PostgreSQL/Local for user journals."
            color="blue"
          />
        </div>

        <div className="md:col-span-1 flex items-center justify-center">
            <Arrow />
        </div>

        {/* Layer 2: Core Logic */}
        <div className="md:col-span-4 space-y-4">
          <div className="text-xs font-mono uppercase text-slate-500 mb-2 tracking-wider">Layer 2: Logic & Calculation</div>
          <ModuleBox 
            title="Analytics Engine" 
            icon={<Cpu size={20} />} 
            description="ROI, Drawdown, and Variance calculations running on both automated and manual datasets."
            color="purple"
          />
           <ModuleBox 
            title="Value Detection" 
            icon={<Activity size={20} />} 
            description="Compares Model Probability vs Market Odds to identify +EV edges."
            color="purple"
          />
        </div>

        <div className="md:col-span-1 flex items-center justify-center">
            <Arrow />
        </div>

        {/* Layer 3: User Interface */}
        <div className="md:col-span-3 space-y-4">
          <div className="text-xs font-mono uppercase text-slate-500 mb-2 tracking-wider">Layer 3: Frontend</div>
           <ModuleBox 
            title="Journal Interface" 
            icon={<BookOpen size={20} />} 
            description="React-based manual entry forms, datagrids, and interactive performance charts."
            color="emerald"
          />
          <ModuleBox 
            title="Risk Dashboard" 
            icon={<ShieldCheck size={20} />} 
            description="Real-time exposure tracking and bankroll health monitoring."
            color="emerald"
          />
        </div>
      </div>

      <div className="mt-12 bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Layers size={20} className="text-blue-400" /> 
            Folder Structure (Implemented)
        </h3>
        <pre className="text-xs text-slate-400 font-mono overflow-x-auto bg-slate-950 p-4 rounded border border-slate-800">
{`/src
  /components
    /journal
      BetEntryForm.tsx   <-- Manual Input
      JournalDashboard.tsx <-- Stats & Charts
    ArchitectureView.tsx
    Dashboard.tsx
    MonteCarlo.tsx
    PredictionEngine.tsx
  /services
    geminiService.ts     <-- AI Predictions
    journalService.ts    <-- Local Persistence (CRUD)
  /utils
    analytics.ts         <-- Financial Math (ROI, Drawdown)
  App.tsx
  types.ts`}
        </pre>
      </div>
    </div>
  );
};

export default ArchitectureView;
