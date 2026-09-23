import React from 'react';
import { useDrawData } from '../context/DrawDataContext';
import { NumberBall } from './NumberBall';
import { 
  LineChart, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Flame, 
  ShieldAlert, 
  ArrowUpRight,
  Info
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const BacktestView: React.FC = () => {
  const { backtest, totalCount } = useDrawData();

  // Cumulative hit rate curve data
  let runningHits = 0;
  const chartPoints = backtest.steps.map((s, idx) => {
    if (s.hitTop1) runningHits++;
    const cumulativePct = Number(((runningHits / (idx + 1)) * 100).toFixed(1));
    return {
      drawIndex: idx + 1,
      drawId: `#${s.drawId.slice(-4)}`,
      hitRate: cumulativePct,
      top3Rate: Number(((backtest.steps.slice(0, idx + 1).filter(x => x.hitTop3).length / (idx + 1)) * 100).toFixed(1)),
      randomBaseline: 10,
    };
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-pink-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-pink-400" />
              <h2 className="font-extrabold text-base sm:text-lg text-white font-['Chakra_Petch']">
                WALK-FORWARD EMPIRICAL BACKTESTING
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict out-of-sample historical validation: Each historical draw was predicted using data strictly prior to its occurrence.
            </p>
          </div>

          <div className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            Evaluated: <strong className="text-white">{backtest.totalEvaluated}</strong> of {totalCount} Draws
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Top-1 Accuracy */}
        <div className="p-4 rounded-2xl glass-panel border border-pink-500/30">
          <div className="text-xs font-mono text-slate-400 uppercase">Top-1 Accuracy</div>
          <div className="text-2xl font-black text-pink-400 font-mono mt-1">
            {backtest.top1Rate}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
            <span className="text-emerald-400">+{Number((backtest.top1Rate - backtest.baselineRandomTop1).toFixed(1))}%</span>
            <span>vs Random (10%)</span>
          </div>
        </div>

        {/* Top-3 Accuracy */}
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30">
          <div className="text-xs font-mono text-slate-400 uppercase">Top-3 Coverage</div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {backtest.top3Rate}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
            <span className="text-emerald-400">+{Number((backtest.top3Rate - backtest.baselineRandomTop3).toFixed(1))}%</span>
            <span>vs Random (30%)</span>
          </div>
        </div>

        {/* Big / Small Accuracy */}
        <div className="p-4 rounded-2xl glass-panel border border-amber-500/30">
          <div className="text-xs font-mono text-slate-400 uppercase">Big / Small Rate</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {backtest.bigSmallRate}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            {backtest.bigSmallHits} / {backtest.totalEvaluated} correct
          </div>
        </div>

        {/* Streaks */}
        <div className="p-4 rounded-2xl glass-panel border border-purple-500/30">
          <div className="text-xs font-mono text-slate-400 uppercase">Max Streaks</div>
          <div className="flex items-center justify-between mt-1">
            <div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {backtest.maxConsecutiveHits} Hits
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Max Win Streak</div>
            </div>
            <div>
              <div className="text-sm font-bold text-rose-400 font-mono">
                {backtest.maxConsecutiveMisses} Misses
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Max Loss Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparisons */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-white font-['Chakra_Petch']">
          MODEL PERFORMANCE VS BASELINES
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Model Architecture</th>
                <th className="p-2.5">Top-1 Rate</th>
                <th className="p-2.5">Top-3 Rate</th>
                <th className="p-2.5 hidden sm:table-cell">Methodology</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {backtest.modelPerformances.map((mp, idx) => (
                <tr key={mp.modelName} className="hover:bg-slate-900/60">
                  <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                    {idx === 0 && <span className="w-2 h-2 rounded-full bg-pink-500" />}
                    <span>{mp.modelName}</span>
                  </td>
                  <td className="p-2.5 font-bold text-pink-400">{mp.top1Rate}%</td>
                  <td className="p-2.5 text-cyan-300">{mp.top3Rate}%</td>
                  <td className="p-2.5 text-slate-400 hidden sm:table-cell">{mp.description}</td>
                </tr>
              ))}
              <tr className="hover:bg-slate-900/60 text-slate-500">
                <td className="p-2.5 font-medium">Random Chance Baseline</td>
                <td className="p-2.5">10.0%</td>
                <td className="p-2.5">30.0%</td>
                <td className="p-2.5 hidden sm:table-cell">Theoretical mathematical expectation (1 of 10)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cumulative Accuracy Curve */}
      {chartPoints.length > 5 && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
            <span>CUMULATIVE WALK-FORWARD TOP-3 HIT RATE CURVE</span>
            <span className="text-cyan-400 font-bold">Top-3 Rate: {backtest.top3Rate}%</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="drawId" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" domain={[0, 60]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val}%`, 'Accuracy']}
                />
                <Area type="monotone" dataKey="top3Rate" stroke="#06b6d4" strokeWidth={2} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Historical Verification Audit Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-white font-bold">STEP-BY-STEP VERIFICATION LOG</span>
          <span className="text-slate-400">Showing last 25 evaluated draws</span>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-2.5">Draw ID</th>
                <th className="p-2.5">Actual</th>
                <th className="p-2.5">Top-1 Pick</th>
                <th className="p-2.5">Top-2 Pick</th>
                <th className="p-2.5">Top-3 Pick</th>
                <th className="p-2.5">Top-1 Hit</th>
                <th className="p-2.5">Top-3 Hit</th>
                <th className="p-2.5">B/S Hit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {backtest.steps.slice(-25).reverse().map((step) => (
                <tr key={step.drawId} className="hover:bg-slate-900/60">
                  <td className="p-2.5 text-white font-bold">#{step.drawId}</td>
                  <td className="p-2.5">
                    <NumberBall number={step.actualResult} size="xs" />
                  </td>
                  <td className="p-2.5">
                    <NumberBall number={step.top1Candidate} size="xs" />
                  </td>
                  <td className="p-2.5">
                    <NumberBall number={step.top2Candidate} size="xs" />
                  </td>
                  <td className="p-2.5">
                    <NumberBall number={step.top3Candidate} size="xs" />
                  </td>
                  <td className="p-2.5">
                    {step.hitTop1 ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hit
                      </span>
                    ) : (
                      <span className="text-slate-500">Miss</span>
                    )}
                  </td>
                  <td className="p-2.5">
                    {step.hitTop3 ? (
                      <span className="text-cyan-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hit
                      </span>
                    ) : (
                      <span className="text-slate-500">Miss</span>
                    )}
                  </td>
                  <td className="p-2.5">
                    {step.hitBigSmall ? (
                      <span className="text-amber-400 font-bold">✓ {step.predictedBigSmall}</span>
                    ) : (
                      <span className="text-slate-500">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
