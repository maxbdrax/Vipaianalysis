import React from 'react';
import { Home, ListOrdered, PlusCircle, BarChart3, LineChart, Settings } from 'lucide-react';

export type NavTab = 'dashboard' | 'results' | 'add' | 'analysis' | 'backtest' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Home', icon: Home },
    { id: 'results' as NavTab, label: 'Results', icon: ListOrdered },
    { id: 'add' as NavTab, label: 'Add', icon: PlusCircle, isPrimary: true },
    { id: 'analysis' as NavTab, label: 'Analysis', icon: BarChart3 },
    { id: 'backtest' as NavTab, label: 'Backtest', icon: LineChart },
    { id: 'settings' as NavTab, label: 'Admin', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-lg border-t border-slate-800/80 shadow-2xl">
      <div className="max-w-md sm:max-w-2xl mx-auto px-3 py-1 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="relative -top-3.5 flex flex-col items-center group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/40 border-2 border-slate-900 group-hover:scale-105 active:scale-95 transition-transform">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold font-mono text-pink-400 mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-pink-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-pink-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
