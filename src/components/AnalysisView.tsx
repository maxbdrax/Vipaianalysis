import React, { useState } from 'react';
import { useDrawData } from '../context/DrawDataContext';
import { NumberBall } from './NumberBall';
import { 
  Grid3X3, 
  Layers, 
  BarChart3, 
  Palette, 
  ArrowRight, 
  Info, 
  TrendingUp, 
  Compass,
  CheckCircle2
} from 'lucide-react';
import { calculateTransitionMatrix } from '../lib/analyticsEngine';

export const AnalysisView: React.FC = () => {
  const { 
    draws, 
    nextAnalysis, 
    bigSmallAnalysis, 
    colorAnalysis, 
    getTwoStepSequence, 
    getThreeStepSequence 
  } = useDrawData();

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'twostep' | 'threestep' | 'models' | 'bs_color'>('matrix');

  // Matrix window filter
  const [matrixWindow, setMatrixWindow] = useState<number | undefined>(undefined);
  const matrixResult = calculateTransitionMatrix(draws, matrixWindow);

  // Selected cell in matrix
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 2, col: 4 });

  // 2-Step interactive state
  const [step1_2, setStep1_2] = useState<number>(2);
  const [step2_2, setStep2_2] = useState<number>(4);
  const seq2 = getTwoStepSequence(step1_2, step2_2);

  // 3-Step interactive state
  const [step1_3, setStep1_3] = useState<number>(9);
  const [step2_3, setStep2_3] = useState<number>(2);
  const [step3_3, setStep3_3] = useState<number>(4);
  const seq3 = getThreeStepSequence(step1_3, step2_3, step3_3);

  // Active cell info for matrix
  const activeCellData = selectedCell
    ? matrixResult.matrix[selectedCell.row][selectedCell.col]
    : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel border border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('matrix')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>10×10 Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('twostep')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'twostep'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>2-Step Patterns</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('threestep')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'threestep'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3-Step Patterns</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('models')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'models'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>8-Model Ensemble</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bs_color')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'bs_color'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Size & Color</span>
        </button>
      </div>

      {/* SUB-TAB 1: 10x10 TRANSITION MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-pink-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white font-['Chakra_Petch']">
                  10×10 MARKOV NUMBER TRANSITION MATRIX
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rows represent Previous Number, Columns represent Next Result. Tap any cell to view transition details.
                </p>
              </div>

              {/* Time Window Filter */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                {[
                  { label: 'All Time', val: undefined },
                  { label: 'Last 100', val: 100 },
                  { label: 'Last 50', val: 50 },
                  { label: 'Last 30', val: 30 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMatrixWindow(item.val)}
                    className={`py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      matrixWindow === item.val
                        ? 'bg-pink-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Heatmap Grid */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[480px]">
                {/* Column Headers */}
                <div className="grid grid-cols-11 gap-1 text-center font-mono text-xs mb-1">
                  <div className="text-[10px] text-slate-500 font-bold self-center">Prev \ Next</div>
                  {Array.from({ length: 10 }, (_, c) => (
                    <div key={`col-${c}`} className="flex justify-center">
                      <NumberBall number={c} size="xs" />
                    </div>
                  ))}
                </div>

                {/* Matrix Rows */}
                {matrixResult.matrix.map((row, r) => (
                  <div key={`row-${r}`} className="grid grid-cols-11 gap-1 my-1">
                    {/* Row Header */}
                    <div className="flex items-center justify-center">
                      <NumberBall number={r} size="xs" />
                    </div>

                    {/* Matrix Cells */}
                    {row.map((cell) => {
                      const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
                      const intensity = matrixResult.maxCount > 0 ? cell.count / matrixResult.maxCount : 0;

                      // Color interpolation from dark slate to bright pink
                      let bgColor = 'rgba(15, 23, 42, 0.6)';
                      if (cell.count > 0) {
                        if (intensity > 0.75) bgColor = 'rgba(244, 63, 94, 0.75)';
                        else if (intensity > 0.5) bgColor = 'rgba(217, 70, 239, 0.6)';
                        else if (intensity > 0.25) bgColor = 'rgba(147, 51, 234, 0.45)';
                        else bgColor = 'rgba(79, 70, 229, 0.35)';
                      }

                      return (
                        <button
                          key={`cell-${cell.row}-${cell.col}`}
                          type="button"
                          onClick={() => setSelectedCell({ row: cell.row, col: cell.col })}
                          style={{ backgroundColor: bgColor }}
                          className={`
                            h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono
                            border transition-all cursor-pointer
                            ${isSelected ? 'border-pink-400 ring-2 ring-pink-500/50 scale-105 z-10' : 'border-white/5 hover:border-pink-500/40'}
                          `}
                        >
                          <span className="font-bold text-white leading-tight">{cell.count}</span>
                          <span className="text-[9px] text-slate-300 leading-tight">{cell.percentage}%</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Cell Inspector Banner */}
            {activeCellData && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-pink-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Previous:</span>
                    <NumberBall number={activeCellData.row} size="xs" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-pink-500" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Next:</span>
                    <NumberBall number={activeCellData.col} size="xs" />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-300">
                  <span>
                    Transition Count: <strong className="text-white">{activeCellData.count}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Row Probability: <strong className="text-pink-400">{activeCellData.percentage}%</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 2-STEP SEQUENCE ENGINE */}
      {activeSubTab === 'twostep' && (
        <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white font-['Chakra_Petch']">
              TWO-STEP SEQUENCE CONTINUATION ENGINE ({step1_2} → {step2_2} → ?)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select two preceding numbers to discover which third number historically appeared next.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="block text-xs font-mono text-slate-400 uppercase mb-2">
                1st Step Number
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <NumberBall
                    key={`seq2-s1-${i}`}
                    number={i}
                    size="sm"
                    selected={step1_2 === i}
                    onClick={() => setStep1_2(i)}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-mono text-slate-400 uppercase mb-2">
                2nd Step Number
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <NumberBall
                    key={`seq2-s2-${i}`}
                    number={i}
                    size="sm"
                    selected={step2_2 === i}
                    onClick={() => setStep2_2(i)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-950 text-xs font-mono text-slate-400 flex items-center justify-between border-b border-slate-800">
              <span>PATTERN: {seq2.pattern} → [NEXT]</span>
              <span>Sample Size: <strong className="text-cyan-400">{seq2.sampleSize} occurrences</strong></span>
            </div>

            {seq2.continuations.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Candidate</th>
                    <th className="p-2.5">Occurrences</th>
                    <th className="p-2.5">Probability</th>
                    <th className="p-2.5">Recency</th>
                    <th className="p-2.5 text-right">Model Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {seq2.continuations.map((item, idx) => (
                    <tr key={item.nextNumber} className="hover:bg-slate-900/60">
                      <td className="p-2.5 flex items-center gap-2">
                        <NumberBall number={item.nextNumber} size="xs" />
                        <span className="font-bold text-white">Num {item.nextNumber}</span>
                        {idx === 0 && (
                          <span className="text-[9px] bg-pink-500/20 text-pink-400 px-1 rounded border border-pink-500/30">
                            TOP SIGNAL
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-200">{item.count}</td>
                      <td className="p-2.5 font-bold text-pink-400">{item.percentage}%</td>
                      <td className="p-2.5 text-slate-400">{item.recencyIndex} draws ago</td>
                      <td className="p-2.5 text-right font-bold text-cyan-300">{item.modelScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                Sequence {seq2.pattern} has not yet occurred in the historical dataset.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: 3-STEP PATTERN ENGINE */}
      {activeSubTab === 'threestep' && (
        <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white font-['Chakra_Petch']">
              THREE-STEP PATTERN ENGINE ({step1_3} → {step2_3} → {step3_3} → ?)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies higher-order historical 3-number continuations in the dataset.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">Step 1</span>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <NumberBall key={`s1-${i}`} number={i} size="xs" selected={step1_3 === i} onClick={() => setStep1_3(i)} />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">Step 2</span>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <NumberBall key={`s2-${i}`} number={i} size="xs" selected={step2_3 === i} onClick={() => setStep2_3(i)} />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">Step 3</span>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <NumberBall key={`s3-${i}`} number={i} size="xs" selected={step3_3 === i} onClick={() => setStep3_3(i)} />
                ))}
              </div>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-950 text-xs font-mono text-slate-400 flex items-center justify-between border-b border-slate-800">
              <span>PATTERN: {seq3.pattern} → [NEXT]</span>
              <span>Sample: <strong className="text-cyan-400">{seq3.sampleSize} occurrences</strong></span>
            </div>

            {seq3.continuations.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Candidate</th>
                    <th className="p-2.5">Occurrences</th>
                    <th className="p-2.5">Probability</th>
                    <th className="p-2.5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {seq3.continuations.map((item, idx) => (
                    <tr key={item.nextNumber} className="hover:bg-slate-900/60">
                      <td className="p-2.5 flex items-center gap-2">
                        <NumberBall number={item.nextNumber} size="xs" />
                        <span className="font-bold text-white">Num {item.nextNumber}</span>
                      </td>
                      <td className="p-2.5 text-slate-200">{item.count}</td>
                      <td className="p-2.5 font-bold text-pink-400">{item.percentage}%</td>
                      <td className="p-2.5 text-right font-bold text-cyan-300">{item.modelScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                Pattern {seq3.pattern} has not yet occurred in the historical dataset.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: 8-MODEL ENSEMBLE */}
      {activeSubTab === 'models' && (
        <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white font-['Chakra_Petch']">
              8-MODEL ENSEMBLE ANALYTICAL MATRIX
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Score breakdown for each candidate number across 7 sub-models and the final weighted ensemble score.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Candidate</th>
                  <th className="p-2.5">Overall Freq</th>
                  <th className="p-2.5">Recent Freq</th>
                  <th className="p-2.5">Transition</th>
                  <th className="p-2.5">2-Step</th>
                  <th className="p-2.5">3-Step</th>
                  <th className="p-2.5">Gap / Cycle</th>
                  <th className="p-2.5">Momentum</th>
                  <th className="p-2.5 text-right font-bold text-pink-400">Ensemble Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {nextAnalysis.candidates.map((cand) => (
                  <tr key={cand.number} className="hover:bg-slate-900/60">
                    <td className="p-2.5 flex items-center gap-2">
                      <NumberBall number={cand.number} size="xs" />
                      <span className="font-bold text-white">Num {cand.number}</span>
                      {cand.rank === 1 && (
                        <span className="text-[9px] px-1 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          #1
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-300">{cand.modelBreakdown['Overall Frequency']}%</td>
                    <td className="p-2.5 text-slate-300">{cand.modelBreakdown['Recent Frequency']}%</td>
                    <td className="p-2.5 text-slate-300">{cand.modelBreakdown['Transition Probability']}%</td>
                    <td className="p-2.5 text-slate-300">{cand.modelBreakdown['2-Step Sequence']}%</td>
                    <td className="p-2.5 text-slate-300">{cand.modelBreakdown['3-Step Sequence']}%</td>
                    <td className="p-2.5 text-slate-300">{cand.modelBreakdown['Gap / Cycle']}</td>
                    <td className="p-2.5 text-slate-300">{cand.modelBreakdown['Rolling Momentum']}</td>
                    <td className="p-2.5 text-right font-bold text-pink-400 text-sm">{cand.modelScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SIZE & COLOR DYNAMICS */}
      {activeSubTab === 'bs_color' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Big / Small Transitions */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white font-['Chakra_Petch']">
              BIG / SMALL TRANSITION PROBABILITIES
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 mb-1">From BIG:</div>
                <div className="text-white">
                  → BIG: <strong className="text-amber-400">{bigSmallAnalysis.transitions.Big.Big}</strong>
                </div>
                <div className="text-white mt-0.5">
                  → SMALL: <strong className="text-cyan-400">{bigSmallAnalysis.transitions.Big.Small}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 mb-1">From SMALL:</div>
                <div className="text-white">
                  → BIG: <strong className="text-amber-400">{bigSmallAnalysis.transitions.Small.Big}</strong>
                </div>
                <div className="text-white mt-0.5">
                  → SMALL: <strong className="text-cyan-400">{bigSmallAnalysis.transitions.Small.Small}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-400 flex justify-between">
              <span>Overall Big: {bigSmallAnalysis.bigPercentage}%</span>
              <span>Overall Small: {bigSmallAnalysis.smallPercentage}%</span>
            </div>
          </div>

          {/* Color Transitions */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white font-['Chakra_Petch']">
              COLOR DYNAMICS (RED / GREEN / PURPLE)
            </h3>

            <div className="space-y-2 text-xs font-mono">
              {(['Red', 'Green', 'Purple'] as const).map((col) => {
                const tr = colorAnalysis.transitions[col];
                return (
                  <div key={col} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white">After {col}:</span>
                    <div className="flex gap-3">
                      <span className="text-rose-400">Red: {tr.Red}</span>
                      <span className="text-emerald-400">Green: {tr.Green}</span>
                      <span className="text-purple-400">Purple: {tr.Purple}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-400 flex justify-between">
              <span className="text-rose-400">Red: {colorAnalysis.percentages.Red}%</span>
              <span className="text-emerald-400">Green: {colorAnalysis.percentages.Green}%</span>
              <span className="text-purple-400">Purple: {colorAnalysis.percentages.Purple}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
