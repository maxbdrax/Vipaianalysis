import React from 'react';
import { useDrawData } from '../context/DrawDataContext';
import { NumberBall } from './NumberBall';
import { Sparkles, Activity, ShieldCheck, ArrowRight, BrainCircuit, RefreshCw, AlertTriangle } from 'lucide-react';

interface VipHeroCardProps {
  onQuickAdd: () => void;
  onExploreSequence: (s1: number, s2: number) => void;
  onOpenAnalysis: () => void;
}

export const VipHeroCard: React.FC<VipHeroCardProps> = ({
  onQuickAdd,
  onExploreSequence,
  onOpenAnalysis,
}) => {
  const { 
    nextAnalysis, 
    backtest, 
    totalCount, 
    syncState, 
    aiExplanation, 
    aiExplanationLoading, 
    fetchAiExplanation 
  } = useDrawData();

  const latestDraw = nextAnalysis.previousResult;
  const currentSeq2 = nextAnalysis.currentSequence2;
  const currentSeq3 = nextAnalysis.currentSequence3;
  const candidates = nextAnalysis.candidates.slice(0, 3);

  const getDataQualityBadge = () => {
    if (totalCount < 30) {
      return {
        text: 'Insufficient historical data (<30)',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      };
    } else if (totalCount < 100) {
      return {
        text: 'Limited historical sample (30–99)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      };
    } else if (totalCount < 500) {
      return {
        text: 'Expanded historical sample (100+)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      };
    } else {
      return {
        text: 'Large historical sample (500+)',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      };
    }
  };

  const quality = getDataQualityBadge();

  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel-vip p-4 sm:p-6 transition-all duration-300">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Frame Header ASCII-styled VIP Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-pink-400 uppercase">
              ╔═════════════════════════════╗
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black tracking-wider text-white font-['Chakra_Petch']">
              WIN GO AI VIP ANALYTICS ENGINE
            </h2>
          </div>
          <div className="text-[10px] font-mono tracking-widest text-pink-400 uppercase">
            ╚═════════════════════════════╝
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE DATABASE ●</span>
          </div>
          <div className={`px-2.5 py-1 rounded-full border text-xs font-mono ${quality.color}`}>
            {quality.text}
          </div>
        </div>
      </div>

      {/* Grid: Current State & Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Left Column: Sequence Context */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-slate-900/60 border border-white/5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-mono text-slate-400 tracking-wider">
                Current Sequence State
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                Window: {nextAnalysis.dataWindow} Draws
              </span>
            </div>

            <div className="flex items-center gap-3">
              {currentSeq2 ? (
                <div className="flex items-center gap-2 bg-slate-950/70 px-3.5 py-2.5 rounded-xl border border-slate-800">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 mb-1">Previous</span>
                    <NumberBall number={currentSeq2[0]} size="md" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-pink-500 animate-pulse" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-pink-400 font-bold mb-1">Latest Draw</span>
                    <NumberBall number={currentSeq2[1]} size="md" selected pulse />
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-cyan-400 font-semibold mb-1">Target</span>
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-cyan-400/80 flex items-center justify-center font-mono font-bold text-cyan-300 text-lg bg-cyan-950/40">
                      ?
                    </div>
                  </div>
                </div>
              ) : latestDraw !== null ? (
                <div className="flex items-center gap-3">
                  <NumberBall number={latestDraw} size="lg" selected />
                  <div>
                    <div className="text-xs text-slate-400">Latest Result</div>
                    <div className="text-base font-bold text-white">Draw #{latestDraw}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">No draws available</div>
              )}
            </div>

            {/* Sequence shortcut */}
            {currentSeq2 && (
              <button
                type="button"
                onClick={() => onExploreSequence(currentSeq2[0], currentSeq2[1])}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Analyze Sequence {currentSeq2[0]} → {currentSeq2[1]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Big / Small and Color statistical indicators */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-mono">B/S Signal</div>
              <div className="text-sm font-bold text-white flex items-center justify-between mt-0.5">
                <span className={nextAnalysis.bigSmallCandidate.prediction === 'Big' ? 'text-amber-400' : 'text-cyan-400'}>
                  {nextAnalysis.bigSmallCandidate.prediction}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {nextAnalysis.bigSmallCandidate.probability}%
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Color Signal</div>
              <div className="text-sm font-bold text-white flex items-center justify-between mt-0.5">
                <span className={
                  nextAnalysis.colorCandidate.prediction === 'Red' ? 'text-rose-400' :
                  nextAnalysis.colorCandidate.prediction === 'Green' ? 'text-emerald-400' : 'text-purple-400'
                }>
                  {nextAnalysis.colorCandidate.prediction}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {nextAnalysis.colorCandidate.probability}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Candidates */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  Next Draw Statistical Candidates
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Model Agreement: <strong className="text-emerald-400">{nextAnalysis.modelAgreement}%</strong>
              </span>
            </div>

            {/* Candidates Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {candidates.map((cand, idx) => {
                const rankLabels = ['① PRIMARY', '② SECONDARY', '③ TERTIARY'];
                const rankBorders = [
                  'border-pink-500/60 bg-pink-950/20 shadow-pink-500/10',
                  'border-purple-500/40 bg-purple-950/20 shadow-purple-500/10',
                  'border-cyan-500/40 bg-cyan-950/20 shadow-cyan-500/10',
                ][idx];

                return (
                  <div
                    key={cand.number}
                    className={`flex flex-col items-center p-3 rounded-xl border ${rankBorders} shadow-lg relative`}
                  >
                    <div className="text-[10px] font-mono font-bold tracking-tight text-slate-300 mb-1.5">
                      {rankLabels[idx]}
                    </div>

                    <NumberBall number={cand.number} size="lg" />

                    <div className="mt-2.5 text-center w-full">
                      <div className="text-xs font-bold text-white font-mono">
                        Score: <span className="text-pink-400">{cand.modelScore}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Trans: {cand.historicalCount} ({cand.historicalPercentage}%)
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Gap: {cand.gap} draws
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistical Validation Bottom Bar */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Sample Size: <strong className="text-white">{nextAnalysis.sampleSize}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                Backtest Top-1: <strong className="text-emerald-400">{backtest.top1Rate}%</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                Top-3: <strong className="text-cyan-400">{backtest.top3Rate}%</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAiExplanation}
                disabled={aiExplanationLoading}
                className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {aiExplanationLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BrainCircuit className="w-3.5 h-3.5 text-pink-400" />
                )}
                <span>AI Breakdown</span>
              </button>

              <button
                type="button"
                onClick={onQuickAdd}
                className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-md shadow-pink-600/30 transition-all cursor-pointer"
              >
                + Add Draw
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Statistical Breakdown Drawer */}
      {aiExplanation && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-purple-500/40 text-xs text-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-pink-400 font-bold font-mono">
              <Sparkles className="w-4 h-4" />
              <span>AI QUANTITATIVE STATISTICAL EXPLANATION</span>
            </div>
            <button
              onClick={() => fetchAiExplanation()}
              className="text-[11px] text-slate-400 hover:text-white font-mono flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Re-analyze
            </button>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed text-slate-300 font-sans">
            {aiExplanation}
          </div>
        </div>
      )}
    </div>
  );
};
