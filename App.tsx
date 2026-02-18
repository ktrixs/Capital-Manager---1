import React, { useState } from 'react';
import { LayoutDashboard, Network, Database, Brain, TrendingUp, ScatterChart as ChartScatter, Settings, BookOpen, Repeat, PieChart, Calculator } from 'lucide-react';
import ArchitectureView from './components/ArchitectureView';
import DatabaseView from './components/DatabaseView';
import PredictionEngine from './components/PredictionEngine';
import MonteCarlo from './components/MonteCarlo';
import Dashboard from './components/Dashboard';
import BettingJournal from './components/BettingJournal';
import CycleBetting from './components/CycleBetting';
import CapitalAllocation from './components/CapitalAllocation';
import KellyCalculator from './components/KellyCalculator';
import ExpectedValueCalculator from './components/ExpectedValueCalculator';
import { ViewState } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.ARCHITECTURE);

  const renderContent = () => {
    switch (currentView) {
      case ViewState.ARCHITECTURE:
        return <ArchitectureView />;
      case ViewState.DATABASE:
        return <DatabaseView />;
      case ViewState.PREDICTION:
        return <PredictionEngine />;
      case ViewState.SIMULATION:
        return <MonteCarlo />;
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.JOURNAL:
        return <BettingJournal />;
      case ViewState.CYCLE:
        return <CycleBetting />;
      case ViewState.ALLOCATION:
        return <CapitalAllocation />;
      case ViewState.CALCULATOR:
        return <KellyCalculator />;
      case ViewState.EV_CALCULATOR:
        return <ExpectedValueCalculator />;
      default:
        return <ArchitectureView />;
    }
  };

  const NavItem: React.FC<{ view: ViewState; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-500">
            <TrendingUp size={28} />
            <h1 className="text-xl font-bold tracking-tight text-white">AlphaBet<span className="text-blue-500">.ai</span></h1>
          </div>
          <p className="text-xs text-slate-500 mt-2">Quantitative Syndicate Terminal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-600 uppercase px-4 mb-2 mt-2">System Design</div>
          <NavItem view={ViewState.ARCHITECTURE} icon={<Network size={20} />} label="Architecture" />
          <NavItem view={ViewState.DATABASE} icon={<Database size={20} />} label="Data Schema" />

          <div className="text-xs font-bold text-slate-600 uppercase px-4 mb-2 mt-6">Intelligence</div>
          <NavItem view={ViewState.DASHBOARD} icon={<LayoutDashboard size={20} />} label="Live Dashboard" />
          <NavItem view={ViewState.PREDICTION} icon={<Brain size={20} />} label="Prediction Engine" />
          
          <div className="text-xs font-bold text-slate-600 uppercase px-4 mb-2 mt-6">Tracking & Risk</div>
          <NavItem view={ViewState.JOURNAL} icon={<BookOpen size={20} />} label="Betting Journal" />
          <NavItem view={ViewState.CALCULATOR} icon={<Calculator size={20} />} label="Kelly Calculator" />
          <NavItem view={ViewState.EV_CALCULATOR} icon={<TrendingUp size={20} />} label="EV Calculator" />
          <NavItem view={ViewState.SIMULATION} icon={<ChartScatter size={20} />} label="Monte Carlo Sim" />
          <NavItem view={ViewState.CYCLE} icon={<Repeat size={20} />} label="Cycle Engine" />
          <NavItem view={ViewState.ALLOCATION} icon={<PieChart size={20} />} label="Capital Allocation" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 cursor-pointer">
            <Settings size={20} />
            <span className="text-sm">Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;