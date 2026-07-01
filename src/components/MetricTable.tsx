/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useMemo } from 'react';
import { MetricDefinition, MetricCategory } from '../types';
import { formatMetricValue } from '../utils';
import { 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Target,
  RotateCcw,
  ShieldCheck,
  X,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface MetricResultRow {
  metric: MetricDefinition;
  hospitalValue: number;
  peerTarget: number;
  variance: number;
  normalizedHospitalScore: number;
}

interface MetricTableProps {
  metricResults: MetricResultRow[];
  activeSimulationId: string | null;
  setActiveSimulationId: (id: string | null) => void;
  // Extra props for inline simulation and ledger integration:
  onSimulationValueChange?: (metricId: string, value: number) => void;
  baselineMetrics?: { [metricId: string]: number };
  categoryScoresBefore?: { [category: string]: number };
  categoryScoresAfter?: { [category: string]: number };
  compositeScoreBefore?: number;
  compositeScoreAfter?: number;
}

export default function MetricTable({
  metricResults,
  activeSimulationId,
  setActiveSimulationId,
  onSimulationValueChange,
  baselineMetrics,
  categoryScoresBefore,
  categoryScoresAfter,
  compositeScoreBefore,
  compositeScoreAfter,
}: MetricTableProps) {

  // Group metrics by category
  const categoriesData = useMemo(() => {
    const categories: { [key in MetricCategory]: MetricResultRow[] } = {
      Outcome: [],
      Structure: [],
      Process: [],
      'Patient Exp': [],
    };

    metricResults.forEach((row) => {
      categories[row.metric.category].push(row);
    });

    return categories;
  }, [metricResults]);

  // Find the selected metric result
  const selectedRow = useMemo(() => {
    if (!activeSimulationId) return null;
    return metricResults.find((r) => r.metric.id === activeSimulationId) || null;
  }, [activeSimulationId, metricResults]);

  // Top clinical strengths (variance >= 0, sorted descending, limit 3)
  const strengths = useMemo(() => {
    return [...metricResults]
      .filter((r) => r.variance >= 0)
      .sort((a, b) => b.variance - a.variance)
      .slice(0, 3);
  }, [metricResults]);

  const categoryScores = categoryScoresAfter || {
    Outcome: 0,
    Structure: 0,
    Process: 0,
    'Patient Exp': 0,
  };

  const getCategoryHealth = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (score >= 75) return 'text-amber-700 bg-amber-50 border-amber-100';
    return 'text-rose-700 bg-rose-50 border-rose-100';
  };

  // Preset Handlers for Selected Metric Simulation
  const handleSetToTarget = () => {
    if (selectedRow && onSimulationValueChange) {
      onSimulationValueChange(selectedRow.metric.id, selectedRow.peerTarget);
    }
  };

  const handleReset = () => {
    if (selectedRow && onSimulationValueChange && baselineMetrics) {
      const originalValue = baselineMetrics[selectedRow.metric.id];
      if (originalValue !== undefined) {
        onSimulationValueChange(selectedRow.metric.id, originalValue);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">Quality Diagnostics & Simulations</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select any clinical indicator below. Trace comparative peer targets and simulate active scenario impacts instantly on the right.
        </p>
      </div>

      {/* Grid containing Categories (8 cols) and Right-Side Interactive Workspace (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Side (Categories): Occupying 8 columns on large viewports */}
        <div className="xl:col-span-8 bg-slate-50/25 border border-slate-200/60 rounded-2xl p-4 shadow-3xs flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(20,_minmax(0,_1fr))] gap-3 items-stretch h-full">
            {(['Outcome', 'Structure', 'Process', 'Patient Exp'] as MetricCategory[]).map((catName) => {
              const metricsList = categoriesData[catName] || [];
              const catScore = categoryScores[catName] ?? 0;
              const healthStyle = getCategoryHealth(catScore);
              
              // Proportion columns based on relative category weights (30%, 25%, 25%, 20%)
              const colSpanClass = {
                Outcome: 'lg:col-span-6 md:col-span-1 col-span-1',
                Structure: 'lg:col-span-5 md:col-span-1 col-span-1',
                Process: 'lg:col-span-5 md:col-span-1 col-span-1',
                'Patient Exp': 'lg:col-span-4 md:col-span-1 col-span-1'
              }[catName];

              const catWeight = {
                Outcome: 30,
                Structure: 25,
                Process: 25,
                'Patient Exp': 20
              }[catName];

              return (
                <div 
                  key={catName}
                  className={`bg-white rounded-xl border border-slate-200/80 p-3 shadow-3xs flex flex-col justify-start gap-2.5 ${colSpanClass}`}
                >
                  {/* Category Column Header */}
                  <div className="flex items-center justify-between border-b border-slate-150/60 pb-2 mb-2.5">
                    <div>
                      <h3 className="text-[10.5px] font-black text-slate-800 uppercase tracking-wider leading-none">
                        {catName === 'Patient Exp' ? 'Experience' : catName}
                      </h3>
                      <span className="text-[8px] font-bold text-slate-400 font-mono block mt-0.5">
                        Weight: {catWeight}%
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border leading-none font-mono ${healthStyle}`}>
                      {catScore.toFixed(0)}%
                    </span>
                  </div>

                  {/* Sub-Metrics vertical stacked list */}
                  <div className="space-y-1.5 flex-grow">
                    {metricsList.map((row) => {
                      const { metric, hospitalValue, variance } = row;
                      const isSelected = activeSimulationId === metric.id;
                      const isBelowTarget = variance < 0;

                      return (
                        <button
                          key={metric.id}
                          onClick={() => setActiveSimulationId(isSelected ? null : metric.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg border transition-all flex flex-col justify-between gap-1 group relative cursor-pointer min-h-[52px] ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-400/60 text-blue-900 ring-2 ring-blue-500/10'
                              : 'bg-slate-50/40 hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700'
                          }`}
                        >
                          {/* Dot indicator and wrapped name */}
                          <div className="flex items-start gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
                              isBelowTarget ? 'bg-rose-500' : 'bg-emerald-500'
                            }`} />
                            <span className={`text-[9px] font-bold leading-tight tracking-tight text-slate-700 break-words ${
                              isSelected ? 'text-blue-700 font-black' : ''
                            }`}>
                              {metric.name}
                            </span>
                          </div>

                          {/* Value & variance details */}
                          <div className="flex items-center justify-between w-full font-mono text-[8.5px] pt-1 mt-0.5 border-t border-slate-100/50">
                            <span className={isSelected ? 'text-blue-600 font-bold' : 'text-slate-500'}>
                              {formatMetricValue(hospitalValue, metric.unit)}
                            </span>
                            <span className={`px-1 py-0.5 rounded-sm font-black text-[8px] leading-none ${
                              isBelowTarget 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {variance >= 0 ? '+' : ''}{variance.toFixed(0)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Panel: Dynamically rendering either Clinical Strengths or Focused What-If Simulator */}
        <div className="xl:col-span-4 flex">
          {selectedRow ? (
            /* ======================================================================= */
            /* ==================== ACTIVE METRIC SIMULATOR CARD ===================== */
            /* ======================================================================= */
            (() => {
              const m = selectedRow.metric;
              const simulatedValue = selectedRow.hospitalValue;
              const peerTarget = selectedRow.peerTarget;
              const originalValue = baselineMetrics ? baselineMetrics[m.id] : simulatedValue;
              const isMeetingTarget = selectedRow.variance >= 0;
              const variance = selectedRow.variance;

              // Compute score impacts
              const catScoreBefore = categoryScoresBefore ? categoryScoresBefore[m.category] : 0;
              const catScoreAfter = categoryScoresAfter ? categoryScoresAfter[m.category] : 0;
              const catDiff = catScoreAfter - catScoreBefore;

              const overallScoreBefore = compositeScoreBefore || 0;
              const overallScoreAfter = compositeScoreAfter || 0;
              const compositeDiff = overallScoreAfter - overallScoreBefore;

              return (
                <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm w-full flex flex-col justify-between space-y-4 animate-fadeIn relative">
                  
                  {/* Card Header with Deselect X */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 border border-blue-500/20 font-mono">
                          {m.category} Submetric
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight tracking-tight mt-1">
                          {m.name}
                        </h4>
                      </div>
                      <button 
                        onClick={() => setActiveSimulationId(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-150"
                        title="Deselect Metric"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
                      {m.description}
                    </p>
                  </div>

                  {/* Comparative values ledger */}
                  <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50/60 rounded-xl border border-slate-150/40 text-center">
                    <div>
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase block leading-none mb-1">Baseline</span>
                      <span className="text-[10px] font-mono font-bold text-slate-600">
                        {formatMetricValue(originalValue, m.unit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase block leading-none mb-1">Peer Target</span>
                      <span className="text-[10px] font-mono font-bold text-slate-700">
                        {formatMetricValue(peerTarget, m.unit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-blue-500 font-bold uppercase block leading-none mb-1">Simulated</span>
                      <span className="text-[10.5px] font-mono font-black text-blue-600">
                        {formatMetricValue(simulatedValue, m.unit)}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator Bar */}
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors text-[10px] ${
                    isMeetingTarget 
                      ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' 
                      : 'bg-rose-50/70 border-rose-100 text-rose-800'
                  }`}>
                    {isMeetingTarget ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="leading-tight font-medium">
                      {isMeetingTarget ? 'Benchmark Target Met' : 'Benchmark Deficit'}:{' '}
                      <span className="font-extrabold font-mono text-slate-800">
                        {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                      </span> deviation.
                    </span>
                  </div>

                  {/* Slider & adjustment controls */}
                  <div className="space-y-1.5 bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Adjustment level</span>
                      <span className="text-xs font-black text-blue-400 font-mono">
                        {formatMetricValue(simulatedValue, m.unit)}
                      </span>
                    </div>

                    {onSimulationValueChange && (
                      <input
                        type="range"
                        min={m.min}
                        max={m.max}
                        step={m.unit === 'FTE' ? 0.05 : m.unit === 'hr/d' ? 0.5 : 0.5}
                        value={simulatedValue}
                        onChange={(e) => onSimulationValueChange(m.id, parseFloat(e.target.value))}
                        className="w-full accent-blue-500 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer focus:outline-none"
                      />
                    )}

                    <div className="flex justify-between text-[8px] font-bold text-slate-500 font-mono">
                      <span>MIN: {formatMetricValue(m.min, m.unit)}</span>
                      <span>MAX: {formatMetricValue(m.max, m.unit)}</span>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-850">
                      <button
                        onClick={handleSetToTarget}
                        className="flex items-center justify-center gap-1 py-1 px-1.5 bg-slate-800 hover:bg-slate-750 text-[9px] font-extrabold text-blue-400 rounded transition-colors border border-slate-700/60 cursor-pointer"
                      >
                        <Target className="w-3 h-3" />
                        Match Target
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex items-center justify-center gap-1 py-1 px-1.5 bg-slate-800 hover:bg-slate-750 text-[9px] font-extrabold text-slate-300 rounded transition-colors border border-slate-700/60 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset Baseline
                      </button>
                    </div>
                  </div>

                  {/* Overall Impact Panel */}
                  <div className="bg-slate-50/60 border border-slate-150 rounded-xl p-3 space-y-2 text-[10px]">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                      Scenario Score Impacts
                    </span>
                    
                    <div className="space-y-1.5">
                      {/* Category Score Impact */}
                      <div className="flex justify-between items-center text-slate-600">
                        <span>{m.category} Category:</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="line-through text-slate-400 text-[9px]">
                            {catScoreBefore.toFixed(1)}%
                          </span>
                          <span className="text-slate-900 font-bold">
                            {catScoreAfter.toFixed(1)}%
                          </span>
                          {catDiff !== 0 && (
                            <span className={`text-[8.5px] font-bold px-1 rounded flex items-center gap-0.5 ${
                              catDiff > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {catDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {catDiff > 0 ? '+' : ''}{catDiff.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Overall Index Impact */}
                      <div className="flex justify-between items-center text-slate-600 pt-1.5 border-t border-slate-150/50">
                        <span className="font-bold text-slate-800">Quality Index:</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="line-through text-slate-400 text-[9px]">
                            {overallScoreBefore.toFixed(1)}
                          </span>
                          <span className="text-slate-900 font-black">
                            {overallScoreAfter.toFixed(1)}
                          </span>
                          {compositeDiff !== 0 && (
                            <span className={`text-[8.5px] font-bold px-1 rounded flex items-center gap-0.5 ${
                              compositeDiff > 0 ? 'bg-emerald-100 text-emerald-700 font-extrabold' : 'bg-rose-100 text-rose-700 font-extrabold'
                            }`}>
                              {compositeDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {compositeDiff > 0 ? '+' : ''}{compositeDiff.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()
          ) : (
            /* ======================================================================= */
            /* ==================== CLINICAL STRENGTHS DEFAULT PANEL ================= */
            /* ======================================================================= */
            <div id="strengths-box" className="bg-emerald-50/45 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between w-full shadow-3xs">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-800 mb-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                  <h4 className="text-[11px] font-black uppercase tracking-wider">Clinical Strengths</h4>
                </div>
                
                <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                  The clinical department outperforms peer targets significantly in these specific areas.
                </p>

                <div className="space-y-2">
                  {strengths.length === 0 ? (
                    <div className="text-[10px] text-slate-400 italic">No outperforming metrics.</div>
                  ) : (
                    strengths.map((s) => (
                      <div key={s.metric.id} className="bg-white/85 p-2.5 rounded-xl border border-emerald-100/60 flex items-center justify-between shadow-3xs">
                        <div className="max-w-[70%]">
                          <span className="text-[10px] font-bold text-slate-800 block leading-tight">{s.metric.name}</span>
                          <span className="text-[8.5px] text-slate-400 font-mono mt-0.5 block">
                            Value: {formatMetricValue(s.hospitalValue, s.metric.unit)}
                          </span>
                        </div>
                        <span className="text-[9.5px] font-mono font-black text-emerald-600 bg-emerald-50/50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          +{s.variance.toFixed(0)}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[9px] text-slate-450 font-mono mt-4 pt-3 border-t border-emerald-100/50">
                Source: Live Department Quality Audit
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
