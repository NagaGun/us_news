/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MetricCards from './components/MetricCards';
import MetricTable from './components/MetricTable';
import ChatWidget from './components/ChatWidget';

import { PEER_GROUPS, DEPARTMENTS, BASELINE_TARGETS } from './data';
import { calculateScores } from './utils';
import { PeerGroup, DepartmentData } from './types';
import { 
  Heart, 
  Layers, 
  Zap, 
  ThumbsUp, 
  Info, 
  RotateCcw, 
  Sparkles,
  Building2,
  Users,
  BriefcaseMedical,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedPeerGroup, setSelectedPeerGroup] = useState<PeerGroup>(PEER_GROUPS[1]); // Statewide Avg default
  const [selectedDept, setSelectedDept] = useState<DepartmentData>(DEPARTMENTS[0]); // Cancer default
  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);

  // Initialize simulated states for all departments with their default baselines
  const [simulatedStates, setSimulatedStates] = useState<{ [deptId: string]: { [metricId: string]: number } }>(() => {
    const states: { [deptId: string]: { [metricId: string]: number } } = {};
    DEPARTMENTS.forEach((dept) => {
      states[dept.id] = { ...dept.metrics };
    });
    return states;
  });

  // Get active simulated values for the selected department
  const activeValues = useMemo(() => {
    return simulatedStates[selectedDept.id] || { ...selectedDept.metrics };
  }, [simulatedStates, selectedDept]);

  // Pass 1: Calculate BASELINE scores (Before simulation)
  const baselineCalculation = useMemo(() => {
    return calculateScores(selectedDept.metrics, selectedPeerGroup, BASELINE_TARGETS);
  }, [selectedDept, selectedPeerGroup]);

  // Pass 2: Calculate SIMULATED scores (After active adjustments)
  const simulatedCalculation = useMemo(() => {
    return calculateScores(activeValues, selectedPeerGroup, BASELINE_TARGETS);
  }, [activeValues, selectedPeerGroup]);

  // Handle single slider change during what-if analysis
  const handleSimulationValueChange = (metricId: string, value: number) => {
    setSimulatedStates((prev) => ({
      ...prev,
      [selectedDept.id]: {
        ...(prev[selectedDept.id] || {}),
        [metricId]: value,
      },
    }));
  };

  // Reset simulation for active department back to standard baseline
  const handleResetActiveDeptSimulation = () => {
    setSimulatedStates((prev) => ({
      ...prev,
      [selectedDept.id]: { ...selectedDept.metrics },
    }));
    setActiveSimulationId(null);
  };

  // Check if current department values differ from baseline
  const isSimulated = useMemo(() => {
    const baselines = selectedDept.metrics;
    return Object.keys(baselines).some(
      (mId) => activeValues[mId] !== baselines[mId]
    );
  }, [activeValues, selectedDept]);

  // Find active simulation metric definition & values
  const activeSimMetric = useMemo(() => {
    if (!activeSimulationId) return null;
    return simulatedCalculation.metricResults.find(
      (r) => r.metric.id === activeSimulationId
    ) || null;
  }, [activeSimulationId, simulatedCalculation]);

  // Count modified variables
  const modifiedCount = useMemo(() => {
    const baselines = selectedDept.metrics;
    return Object.keys(baselines).filter(
      (mId) => activeValues[mId] !== baselines[mId]
    ).length;
  }, [activeValues, selectedDept]);

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex">
        {/* 1. Left Fixed Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Pane */}
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        
        {/* Top Control Bar */}
        <TopBar
          selectedPeerGroup={selectedPeerGroup}
          setSelectedPeerGroup={setSelectedPeerGroup}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
          onResetSimulation={handleResetActiveDeptSimulation}
          isSimulated={isSimulated}
        />

        {/* View Routing */}
        <main className="flex-grow p-8 max-w-7xl w-full mx-auto pb-24">
          {activeTab === 'home' ? (
            <div className="space-y-6">
              
              {/* Executive Summary Alert Banner */}
              <div id="executive-summary-banner" className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Hospital Strategic Quality Intelligence Panel</h2>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                      Welcome to CareAnalytics Metropolitan. Benchmark performance indexes against comparative peer groups. 
                      You can adjust metrics classified as red directly from the grid below to forecast score increases.
                    </p>
                  </div>
                </div>

                {/* Simulation Summary Status */}
                {isSimulated ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 self-start md:self-auto">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                    <div className="text-xs">
                      <p className="font-bold text-amber-900">
                        {modifiedCount} simulated {modifiedCount === 1 ? 'variable' : 'variables'} active
                      </p>
                      <p className="text-amber-700 text-[10px] mt-0.5">
                        Rating shifted by{' '}
                        <span className="font-extrabold font-mono">
                          {(simulatedCalculation.compositeScore - baselineCalculation.compositeScore).toFixed(1)}
                        </span>{' '}
                        composite pts
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-500 self-start md:self-auto">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Displaying pristine clinical baselines</span>
                  </div>
                )}
              </div>

              {/* 2. Top Metric KPI Cards & Circular Composite Gauge */}
              <MetricCards
                categoryScores={simulatedCalculation.categoryScores}
                compositeScore={simulatedCalculation.compositeScore}
                baselineCategoryScores={baselineCalculation.categoryScores}
                baselineCompositeScore={baselineCalculation.compositeScore}
                isSimulated={isSimulated}
              />

              {/* 3. Quality Diagnostics (Proportionate Heat-Mapped Ledger & Simulation Workspace) */}
              <MetricTable
                metricResults={simulatedCalculation.metricResults}
                activeSimulationId={activeSimulationId}
                setActiveSimulationId={setActiveSimulationId}
                onSimulationValueChange={handleSimulationValueChange}
                baselineMetrics={selectedDept.metrics}
                categoryScoresBefore={baselineCalculation.categoryScores}
                categoryScoresAfter={simulatedCalculation.categoryScores}
                compositeScoreBefore={baselineCalculation.compositeScore}
                compositeScoreAfter={simulatedCalculation.compositeScore}
              />
            </div>
          ) : (
            /* Affiliate network peer view */
            <div id="affiliates-view" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Metropolitan Clinical Network</h2>
                </div>
                <p className="text-sm text-slate-500 max-w-2xl">
                  Comparative performance audit of Metropolitan Health System branches. View operational size, license grades, and active bed allocations.
                </p>
 
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {/* Branch 1 */}
                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all bg-slate-50/30">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider font-mono">Downtown Main</span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">Metropolitan Downtown</h3>
                      </div>
                      <span className="text-lg font-black text-slate-900 font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                        A
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>Staff Beds:</span>
                        <span className="font-bold text-slate-800">750 Beds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Admissions:</span>
                        <span className="font-bold text-slate-800">42,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EMR Compliance:</span>
                        <span className="font-bold text-emerald-600 font-mono">100% Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Branch 2 */}
                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all bg-slate-50/30">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider font-mono font-mono">Suburban Affiliate</span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">Metro West Valley</h3>
                      </div>
                      <span className="text-lg font-black text-slate-900 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                        B+
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>Staff Beds:</span>
                        <span className="font-bold text-slate-800">320 Beds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Admissions:</span>
                        <span className="font-bold text-slate-800">18,200</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EMR Compliance:</span>
                        <span className="font-bold text-emerald-600 font-mono">100% Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Branch 3 */}
                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all bg-slate-50/30">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider font-mono">Pediatric Specialized</span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">Children\'s Specialty Center</h3>
                      </div>
                      <span className="text-lg font-black text-slate-900 font-mono bg-amber-500/10 px-2 py-0.5 rounded">
                        A-
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>Staff Beds:</span>
                        <span className="font-bold text-slate-800">180 Beds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Admissions:</span>
                        <span className="font-bold text-slate-800">12,100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EMR Compliance:</span>
                        <span className="font-bold text-emerald-600 font-mono">100% Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>

    {/* Floating Operations Assistant Chatbot — overlays all content */}
    <ChatWidget />
    </>
  );
}
