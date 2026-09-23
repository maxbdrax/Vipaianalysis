import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDrawData } from '../context/DrawDataContext';
import { UserRole } from '../types';
import { 
  Settings, 
  Users, 
  ShieldCheck, 
  RotateCcw, 
  FileText, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Clock,
  Info
} from 'lucide-react';

interface SettingsViewProps {
  onOpenAuth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuth }) => {
  const { currentUser, userProfile, role, isAdmin, allUsers, updateUserRole, logout } = useAuth();
  const { auditLogs, resetToSeedData, totalCount } = useDrawData();

  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Handle Reset to Seed Data
  const handleResetSeed = async () => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to reset all data back to the authentic 150-draw historical dataset?')) return;
    setResetting(true);
    setResetSuccess(null);
    try {
      await resetToSeedData();
      setResetSuccess('Database successfully reset to authentic 150 historical WinGo draws.');
    } catch (e: any) {
      alert(`Reset error: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* User Profile Card */}
      <div className="glass-panel p-5 rounded-2xl border border-pink-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-pink-600/30">
              {currentUser?.email ? currentUser.email[0].toUpperCase() : 'VIP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  {currentUser ? (currentUser.displayName || currentUser.email) : 'Guest VIP Visitor'}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                  role === 'ANALYST' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {role}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {currentUser ? `Firebase UID: ${currentUser.uid.slice(0, 14)}...` : 'Sign in to access VIP features'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={logout}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-pink-600/30 cursor-pointer"
              >
                Sign In to VIP Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Capabilities Reference */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role Permissions Matrix</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-bold text-rose-400">ADMIN:</span>
            <ul className="mt-1 space-y-1 text-slate-400 text-[11px]">
              <li>✓ Add / Edit / Delete draws</li>
              <li>✓ Bulk CSV & OCR import</li>
              <li>✓ Manage user roles</li>
              <li>✓ View audit logs</li>
              <li>✓ Reset database seed</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-bold text-amber-400">ANALYST:</span>
            <ul className="mt-1 space-y-1 text-slate-400 text-[11px]">
              <li>✓ Add draws</li>
              <li>✓ Ingest bulk/OCR draws</li>
              <li>✓ Run advanced backtests</li>
              <li>✓ View full analytics</li>
              <li>✗ Cannot delete or edit</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-bold text-slate-400">VIEWER:</span>
            <ul className="mt-1 space-y-1 text-slate-400 text-[11px]">
              <li>✓ Real-time synced dashboard</li>
              <li>✓ View 10x10 transitions</li>
              <li>✓ View backtest statistics</li>
              <li>✗ Read-only permissions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ADMIN: USER MANAGEMENT TABLE */}
      {isAdmin && (
        <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-400" />
              <h4 className="font-bold text-sm text-white font-['Chakra_Petch']">
                USER ROLES MANAGEMENT
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">{allUsers.length} Users</span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">User Email</th>
                  <th className="p-2.5">Current Role</th>
                  <th className="p-2.5 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {allUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-900/60">
                    <td className="p-2.5 text-white font-medium">
                      {u.email}
                      {u.email === 'developermaxbd@gmail.com' && (
                        <span className="ml-2 text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                          ROOT OWNER
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300' :
                        u.role === 'ANALYST' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {u.email !== 'developermaxbd@gmail.com' && (
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                        >
                          <option value="VIEWER">VIEWER</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN: DATABASE ACTIONS & AUDIT LOGS */}
      {isAdmin && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-white font-['Chakra_Petch'] flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>DATABASE SEED RECOVERY</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Restores the database to the 150 official historical WinGo records.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetSeed}
              disabled={resetting}
              className="py-2 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
            >
              {resetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Restore Authentic 150 Seed Draws</span>
            </button>
          </div>

          {resetSuccess && (
            <div className="p-3 rounded-xl text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* Audit Logs Table */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>SYSTEM AUDIT LOGS ({auditLogs.length})</span>
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-2">Time</th>
                    <th className="p-2">Action</th>
                    <th className="p-2">Record ID</th>
                    <th className="p-2">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {auditLogs.slice(0, 30).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60">
                      <td className="p-2 text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE' ? 'text-emerald-400 bg-emerald-500/10' :
                          log.action === 'UPDATE' ? 'text-cyan-400 bg-cyan-500/10' :
                          log.action === 'DELETE' ? 'text-rose-400 bg-rose-500/10' :
                          'text-purple-400 bg-purple-500/10'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2 text-slate-200">{log.recordId}</td>
                      <td className="p-2 text-slate-400 text-[11px] truncate max-w-[120px]">{log.userEmail}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Statistical Research Notice */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <Info className="w-4 h-4 text-pink-400" />
          <span>WIN GO VIP RESEARCH SYSTEM - RESPONSIBLE USAGE POLICY</span>
        </div>
        <p className="leading-relaxed">
          This system provides pure historical statistical calculations, Markov transition frequencies, and multi-model walk-forward backtests. In fair games, every lottery result is an independent random variable. No algorithm can guarantee future lottery outcomes. Never wager money you cannot afford to lose.
        </p>
      </div>
    </div>
  );
};
