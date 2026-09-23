import React, { useState } from 'react';
import { useDrawData } from '../context/DrawDataContext';
import { VipHeroCard } from './VipHeroCard';
import { NumberBall } from './NumberBall';
import { 
  TrendingUp, 
  ArrowRight, 
  History, 
  Layers, 
  BarChart2, 
  Compass, 
  Sparkles,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
  onExploreSequence: (s1: number, s2: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onExploreSequence,
}) => {
  const { 
    drawsReversed, 
    nextAnalysis, 
    totalCount, 
    getTransitionForNumber, 
    getTwoStepSequence 
  } = useDrawData();

  // Interactive sequence explorer state on dashboard
  const latestPrev = nextAnalysis.currentSequence2 ? nextAnalysis.currentSequence2[0] : 2;
  const latestCurr = nextAnalysis.currentSequence2 ? nextAnalysis.currentSequence2[1] : 4;
  
  const [seqStep1, setSeqStep1] = useState<number>(latestPrev);
  const [seqStep2, setSeqStep2] = useState<number>(latestCurr);

  // Compute live sequence continuation for the selected 2 numbers
  const liveSeq = getTwoStepSequence(seqStep1, seqStep2);

  // Single number transition state
  const [selectedNum, setSelectedNum] = useState<number>(latestCurr);
  const transData = getTransitionForNumber(selectedNum);

  // Chart data for 2-step sequence continuation
  const seqChartData = liveSeq.continuations.map((c) => ({
    number: `Num ${c.nextNumber}`,
    rawNum: c.nextNumber,
    count: c.count,
    percentage: c.percentage,
    score: c.modelScore,
  }));

  return (
    <div className="space-y-6 pb-20">
      {/* 1. VIP Top Hero Analytics Card */}
      <VipHeroCard
        onQuickAdd={() => onNavigateTab('add')}
        onExploreSequence={(s1, s2) => {
          setSeqStep1(s1);
          setSeqStep2(s2);
        }}
        onOpenAnalysis={() => onNavigateTab('analysis')}
      />

      {/* 2. Interactive Sequence Pattern Generator (User's Primary Focus) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-pink-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-pink-400" />
              <h3 className="font-extrabold text-base sm:text-lg text-white font-['Chakra_Petch']">
                SEQUENCE CONTINUATION ANALYZER ({seqStep1} → {seqStep2} → ?)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any two previous numbers to view all historical numbers that followed them.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Sample:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono text-cyan-300 border border-slate-700">
              {liveSeq.sampleSize} Occurrences
            </span>
          </div>
        </div>

        {/* Step 1 & Step 2 Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">
              Step 1 (First Number)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }, (_, i) => (
                <NumberBall
                  key={`s1-${i}`}
                  number={i}
                  size="sm"
                  selected={seqStep1 === i}
                  onClick={() => setSeqStep1(i)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">
              Step 2 (Second Number)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }, (_, i) => (
                <NumberBall
                  key={`s2-${i}`}
                  number={i}
                  size="sm"
                  selected={seqStep2 === i}
                  onClick={() => setSeqStep2(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sequence Continuation Results */}
        <div className="mt-4">
          {liveSeq.continuations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Bar Chart Visualization */}
              <div className="lg:col-span-7 h-52 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                  <span>HISTORICAL CONTINUATION FREQUENCY (%)</span>
                  <span className="text-pink-400">Top: Num {liveSeq.topCandidate}</span>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={seqChartData}>
                    <XAxis dataKey="number" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Frequency']}
                    />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {seqChartData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={idx === 0 ? '#f43f5e' : idx === 1 ? '#a855f7' : '#06b6d4'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Continuations Ranked Cards */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
                <div className="space-y-2">
                  {liveSeq.continuations.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.nextNumber}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <NumberBall number={item.nextNumber} size="sm" />
                        <div>
                          <div className="text-xs font-bold text-white font-mono">
                            Appeared {item.count} times
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Last seen: {item.recencyIndex} draws ago
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-extrabold text-pink-400 font-mono">
                          {item.percentage}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Score {item.modelScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!liveSeq.isSufficient && (
                  <div className="text-[11px] text-amber-400/90 font-mono bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Limited sample: {liveSeq.sampleSize} historical match(es).</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs font-mono">
              The exact sequence <strong className="text-white">{seqStep1} → {seqStep2}</strong> has not yet appeared in the current {totalCount} historical draws.
            </div>
          )}
        </div>
      </div>

      {/* 3. Single-Number Historical Transition Matrix (0 to 9) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-base sm:text-lg text-white font-['Chakra_Petch']">
                NUMBER TRANSITION PROBABILITY (1-STEP MARKOV)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical distribution of numbers that appeared immediately after previous draw.
            </p>
          </div>

          {/* Quick Number Selector 0-9 */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-[11px] text-slate-400 font-mono mr-1">Previous:</span>
            {Array.from({ length: 10 }, (_, i) => (
              <NumberBall
                key={`trans-${i}`}
                number={i}
                size="xs"
                selected={selectedNum === i}
                onClick={() => setSelectedNum(i)}
              />
            ))}
          </div>
        </div>

        {/* Transition Candidates Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {transData.candidates.map((cand, idx) => (
            <div
              key={cand.candidate}
              className={`p-2.5 rounded-xl border transition-all ${
                idx === 0
                  ? 'bg-pink-950/20 border-pink-500/50 shadow-md shadow-pink-500/10'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <NumberBall number={cand.candidate} size="sm" />
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  #{idx + 1}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-white font-mono flex items-center justify-between">
                  <span>{cand.percentage}%</span>
                  <span className="text-[10px] text-slate-400">{cand.count}x</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      idx === 0 ? 'bg-pink-500' : idx === 1 ? 'bg-purple-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, cand.percentage * 2.5)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>Score {cand.score}</span>
                  <span>Gap {cand.gap}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Historical Draws Ticker (Matching Official WinGo UI) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-sm sm:text-base text-white font-['Chakra_Petch']">
              LATEST OFFICIAL WIN GO DRAWS
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('results')}
            className="text-xs text-pink-400 hover:text-pink-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({totalCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-center gap-2.5 min-w-max py-2">
            {drawsReversed.slice(0, 14).map((d, idx) => (
              <div
                key={d.drawId}
                className={`flex flex-col items-center p-2.5 rounded-xl border min-w-[70px] ${
                  idx === 0
                    ? 'bg-pink-950/40 border-pink-500/60 ring-2 ring-pink-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-400 mb-1">
                  #{d.drawId.slice(-4)}
                </span>
                <NumberBall number={d.result} size="md" pulse={idx === 0} />
                <div className="flex items-center gap-1 mt-1.5 text-[10px] font-mono">
                  <span className={d.bigSmall === 'Big' ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
                    {d.bigSmall[0]}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className={d.color.includes('Red') ? 'text-rose-400' : 'text-emerald-400'}>
                    {d.color[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Responsible Statistical Research Disclaimer (Mandatory) */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono leading-relaxed">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Statistical Research Notice:</strong> Historical statistical analysis and transition probability models do not guarantee future lottery outcomes. Every lottery draw remains an independent random event. This VIP system provides academic pattern research and mathematical transition metrics only.
          </div>
        </div>
      </div>
    </div>
  );
};
