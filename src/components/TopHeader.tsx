import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useDrawData } from '../context/DrawDataContext';
import { Shield, Sparkles, RefreshCw, UserCheck, LogIn, AlertCircle } from 'lucide-react';

interface TopHeaderProps {
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenAuth, onOpenProfile }) => {
  const { currentUser, userProfile, role, isAdmin } = useAuth();
  const { syncState, lastUpdated, totalCount } = useDrawData();

  const formattedTime = lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const getSyncBadge = () => {
    switch (syncState) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE SYNC
          </span>
        );
      case 'SYNCHRONIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            ✓ SYNCHRONIZED
          </span>
        );
      case 'SYNCING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            SYNCING
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            OFFLINE
          </span>
        );
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold tracking-wider uppercase">
            ADMIN
          </span>
        );
      case 'ANALYST':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold tracking-wider uppercase">
            ANALYST
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 border border-slate-600 text-[10px] font-medium tracking-wider uppercase">
            VIEWER
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-[#07090e]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/25 border border-pink-400/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-cyan-300 font-['Chakra_Petch']">
                WIN GO AI
              </h1>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 border border-pink-500/40 uppercase tracking-widest">
                VIP
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono tracking-tight flex items-center gap-1.5">
              <span>LOTTERY ANALYZER</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-semibold">{totalCount} DRAWS</span>
            </div>
          </div>
        </div>

        {/* Status & Sync Badges */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Firebase:</span>
            {getSyncBadge()}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Updated:</span>
            <span className="text-slate-200">{formattedTime}</span>
          </div>
        </div>

        {/* User Status / Role / Auth Action */}
        <div className="flex items-center gap-2">
          {currentUser || userProfile ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all text-left text-xs cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-[11px] font-bold">
                {(userProfile?.email || currentUser?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-slate-200 font-medium truncate max-w-[120px]">
                  {userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0]}
                </div>
                <div className="flex items-center gap-1">
                  {getRoleBadge()}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-pink-600/30 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>VIP Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
