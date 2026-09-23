import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDrawData } from '../context/DrawDataContext';
import { NumberBall } from './NumberBall';
import { DrawResult, BigSmallType, ColorType } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

export const ResultsView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { drawsReversed, totalCount, updateDrawResult, deleteDrawResult } = useDrawData();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterNumber, setFilterNumber] = useState<string>('all');
  const [filterBigSmall, setFilterBigSmall] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  // Edit Modal state
  const [editingDraw, setEditingDraw] = useState<DrawResult | null>(null);
  const [editNum, setEditNum] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Filtered dataset
  const filteredDraws = useMemo(() => {
    return drawsReversed.filter((d) => {
      // Query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesId = d.drawId.toLowerCase().includes(q);
        const matchesDate = d.dateStr?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesDate) return false;
      }

      // Number filter
      if (filterNumber !== 'all' && d.result !== Number(filterNumber)) {
        return false;
      }

      // Big/Small filter
      if (filterBigSmall !== 'all' && d.bigSmall !== filterBigSmall) {
        return false;
      }

      // Color filter
      if (filterColor !== 'all') {
        if (filterColor === 'Red' && !d.color.includes('Red')) return false;
        if (filterColor === 'Green' && !d.color.includes('Green')) return false;
        if (filterColor === 'Purple' && !d.color.includes('Purple')) return false;
      }

      return true;
    });
  }, [drawsReversed, searchQuery, filterNumber, filterBigSmall, filterColor]);

  const totalPages = Math.max(1, Math.ceil(filteredDraws.length / pageSize));
  const currentDraws = filteredDraws.slice((page - 1) * pageSize, page * pageSize);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['DrawID', 'Result', 'BigSmall', 'Color', 'OddEven', 'Date', 'Time', 'Source'];
    const rows = drawsReversed.map((d) => [
      d.drawId,
      d.result,
      d.bigSmall,
      d.color,
      d.oddEven,
      d.dateStr || '',
      d.timeStr || '',
      d.source || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wingo_draws_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Edit Modal
  const handleStartEdit = (draw: DrawResult) => {
    setEditingDraw(draw);
    setEditNum(draw.result);
    setEditNotes(draw.notes || '');
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingDraw) return;
    setEditSaving(true);
    setEditError(null);

    const res = await updateDrawResult({
      drawId: editingDraw.drawId,
      result: editNum,
      notes: editNotes,
    });

    setEditSaving(false);
    if (res.success) {
      setEditingDraw(null);
    } else {
      setEditError(res.error || 'Failed to update record');
    }
  };

  // Delete Action
  const handleDelete = async (drawId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Draw #${drawId}?`)) return;
    await deleteDrawResult(drawId);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white font-['Chakra_Petch']">
            LIVE HISTORICAL RESULTS ({totalCount})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized database view ordered chronologically (newest first).
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 glass-panel p-3.5 rounded-2xl">
        {/* Search Input */}
        <div className="col-span-2 sm:col-span-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Draw ID / Date..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Number Filter */}
        <div>
          <select
            value={filterNumber}
            onChange={(e) => {
              setFilterNumber(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-pink-500"
          >
            <option value="all">All Numbers (0-9)</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={i}>Number {i}</option>
            ))}
          </select>
        </div>

        {/* Big / Small Filter */}
        <div>
          <select
            value={filterBigSmall}
            onChange={(e) => {
              setFilterBigSmall(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-pink-500"
          >
            <option value="all">All Sizes (B/S)</option>
            <option value="Big">Big (5-9)</option>
            <option value="Small">Small (0-4)</option>
          </select>
        </div>

        {/* Color Filter */}
        <div>
          <select
            value={filterColor}
            onChange={(e) => {
              setFilterColor(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-pink-500"
          >
            <option value="all">All Colors</option>
            <option value="Red">Red</option>
            <option value="Green">Green</option>
            <option value="Purple">Purple</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Draw ID</th>
                <th className="py-3 px-3.5">Number</th>
                <th className="py-3 px-3.5">Size</th>
                <th className="py-3 px-3.5">Color</th>
                <th className="py-3 px-3.5">Parity</th>
                <th className="py-3 px-3.5 hidden md:table-cell">Timestamp</th>
                <th className="py-3 px-3.5 hidden sm:table-cell">Source</th>
                {isAdmin && <th className="py-3 px-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {currentDraws.length > 0 ? (
                currentDraws.map((d, idx) => (
                  <tr key={d.drawId} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-white">
                      #{d.drawId}
                      {idx === 0 && page === 1 && (
                        <span className="ml-1.5 text-[9px] font-black px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30 uppercase">
                          LATEST
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <NumberBall number={d.result} size="sm" />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        d.bigSmall === 'Big' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {d.bigSmall}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        d.color.includes('Red') ? 'bg-rose-500/20 text-rose-300' :
                        d.color.includes('Green') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {d.color}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-300">
                      {d.oddEven}
                    </td>
                    <td className="py-2.5 px-3.5 hidden md:table-cell text-slate-400">
                      {d.dateStr} {d.timeStr}
                    </td>
                    <td className="py-2.5 px-3.5 hidden sm:table-cell text-slate-500 text-[11px]">
                      {d.source || 'Manual'}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(d)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 cursor-pointer"
                            title="Edit Result"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d.drawId)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                            title="Delete Result"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-400 text-xs">
                    No lottery results match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredDraws.length)} of {filteredDraws.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-200">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL FOR ADMIN */}
      {editingDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel-vip rounded-2xl max-w-sm w-full p-5 border border-pink-500/40 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-white text-base font-['Chakra_Petch']">
                EDIT DRAW #{editingDraw.drawId}
              </h3>
              <button
                type="button"
                onClick={() => setEditingDraw(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono mb-3">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Update Number (0–9)
                </label>
                <div className="flex flex-wrap gap-1.5 justify-center py-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  {Array.from({ length: 10 }, (_, i) => (
                    <NumberBall
                      key={i}
                      number={i}
                      size="sm"
                      selected={editNum === i}
                      onClick={() => setEditNum(i)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Reason for edit..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDraw(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-mono font-bold shadow-md shadow-pink-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editSaving ? 'Saving...' : 'Update Result'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
