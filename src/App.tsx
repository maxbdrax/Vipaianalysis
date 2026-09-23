import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DrawDataProvider, useDrawData } from './context/DrawDataContext';
import { TopHeader } from './components/TopHeader';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { ResultsView } from './components/ResultsView';
import { AddResultView } from './components/AddResultView';
import { AnalysisView } from './components/AnalysisView';
import { BacktestView } from './components/BacktestView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { Sparkles, RefreshCw } from 'lucide-react';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const { loading } = useDrawData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-pink-500/30 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="mt-4 font-black text-lg text-white font-['Chakra_Petch'] tracking-wider">
          WIN GO AI VIP ANALYZER
        </h2>
        <div className="flex items-center gap-2 mt-2 text-xs font-mono text-pink-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Synchronizing Firestore Database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Top Header */}
      <TopHeader
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setActiveTab('settings')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-24">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={setActiveTab}
            onExploreSequence={(_s1, _s2) => {
              setActiveTab('analysis');
            }}
          />
        )}

        {activeTab === 'results' && <ResultsView />}

        {activeTab === 'add' && <AddResultView />}

        {activeTab === 'analysis' && <AnalysisView />}

        {activeTab === 'backtest' && <BacktestView />}

        {activeTab === 'settings' && (
          <SettingsView onOpenAuth={() => setIsAuthOpen(true)} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DrawDataProvider>
        <MainContent />
      </DrawDataProvider>
    </AuthProvider>
  );
}
