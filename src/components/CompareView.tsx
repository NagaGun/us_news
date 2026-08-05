/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DepartmentData } from '../types';
import { DEPARTMENTS, METRIC_DEFINITIONS, BASELINE_TARGETS } from '../data';
import { PEER_HOSPITALS_POOL, PeerHospital, calculateHospitalCategoryScores } from '../data/mockPeerData';
import { formatMetricValue } from '../utils';
import { Plus, X, Info, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';

interface CompareViewProps {
  selectedDept: DepartmentData;
  setSelectedDept: (dept: DepartmentData) => void;
}

export default function CompareView({ selectedDept, setSelectedDept }: CompareViewProps) {
  const MY_COLOR = '#1E3A8A'; // Dark Blue
  const PEER_COLORS = [
    '#059669', // Emerald
    '#D97706', // Amber
    '#7C3AED', // Violet
    '#DB2777', // Pink
    '#0284C7', // Light Blue
  ];

  // Selected peer hospitals state (default to first 3 peers)
  const [selectedPeerIds, setSelectedPeerIds] = useState<string[]>([
    'riverside',
    'st_augustine',
    'pacific_union',
  ]);

  // Metric table category filter tab
  const [activeTableTab, setActiveTableTab] = useState<string>('All');

  // Modal / Dropdown for "+ Add peer"
  const [isAddPeerOpen, setIsAddPeerOpen] = useState<boolean>(false);

  // Active peer hospital objects
  const selectedPeers = useMemo(() => {
    return PEER_HOSPITALS_POOL.filter((p) => selectedPeerIds.includes(p.id));
  }, [selectedPeerIds]);

  // Unselected peer hospitals available to add
  const availablePeersToAdd = useMemo(() => {
    return PEER_HOSPITALS_POOL.filter((p) => !selectedPeerIds.includes(p.id));
  }, [selectedPeerIds]);

  // Handle removing a peer chip
  const handleRemovePeer = (peerId: string) => {
    if (selectedPeerIds.length <= 1) return; // keep at least 1
    setSelectedPeerIds((prev) => prev.filter((id) => id !== peerId));
  };

  // Handle adding a peer
  const handleAddPeer = (peerId: string) => {
    if (!selectedPeerIds.includes(peerId)) {
      setSelectedPeerIds((prev) => [...prev, peerId]);
    }
    setIsAddPeerOpen(false);
  };

  // Calculate Metropolitan Hospital category scores for current selected department
  const myCategoryScores = useMemo(() => {
    return calculateHospitalCategoryScores(selectedDept.metrics);
  }, [selectedDept]);

  // Calculate Category Scores for each selected peer hospital under current department
  const peersCategoryScores = useMemo(() => {
    return selectedPeers.map((peer) => {
      const deptMetrics = peer.metricsByDept[selectedDept.id] || peer.metricsByDept['cancer'] || selectedDept.metrics;
      const scores = calculateHospitalCategoryScores(deptMetrics);
      return {
        peer,
        scores,
        metrics: deptMetrics,
      };
    });
  }, [selectedPeers, selectedDept]);

  // Calculate how many categories out of 5 Metropolitan Hospital is ahead of peer average
  const aheadCategoriesCount = useMemo(() => {
    if (selectedPeers.length === 0) return 0;
    const categories: Array<'Overall' | 'Outcome' | 'Structure' | 'Process' | 'Patient Exp'> = [
      'Overall',
      'Outcome',
      'Structure',
      'Process',
      'Patient Exp',
    ];

    let aheadCount = 0;
    categories.forEach((cat) => {
      const myScore = myCategoryScores[cat] || 0;
      const avgPeerScore =
        peersCategoryScores.reduce((sum, item) => sum + (item.scores[cat] || 0), 0) /
        peersCategoryScores.length;
      if (myScore >= avgPeerScore) {
        aheadCount++;
      }
    });

    return aheadCount;
  }, [myCategoryScores, peersCategoryScores, selectedPeers]);

  // Filter metrics for the comparison table based on active tab
  const filteredMetrics = useMemo(() => {
    if (activeTableTab === 'All') return METRIC_DEFINITIONS;
    if (activeTableTab === 'Experience') {
      return METRIC_DEFINITIONS.filter((m) => m.category === 'Patient Exp');
    }
    return METRIC_DEFINITIONS.filter((m) => m.category === activeTableTab);
  }, [activeTableTab]);

  // Helper for category dot color in table
  const getCategoryDotColor = (category: string) => {
    switch (category) {
      case 'Outcome':
        return '#E23744'; // red
      case 'Structure':
        return '#0F9D58'; // green
      case 'Process':
        return '#C97C10'; // amber
      case 'Patient Exp':
        return '#3B5BFF'; // blue
      default:
        return '#64748B';
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <div className="text-[11.5px] text-slate-500 font-semibold tracking-wider uppercase mb-2">
            QUALITY / COMPARE &nbsp;·&nbsp; <b className="text-[#3B5BFF]">PEER BENCHMARKING</b>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {selectedDept.name} — Peer Group Comparison
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl mt-1 leading-relaxed">
            Metropolitan Hospital measured against the peer hospitals selected below. Arrows show the difference versus your score for each metric.
          </p>
        </div>

        {/* Dropdowns & Peer Chips */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
              Clinical Department
            </label>
            <select
              value={selectedDept.id}
              onChange={(e) => {
                const dept = DEPARTMENTS.find((d) => d.id === e.target.value);
                if (dept) setSelectedDept(dept);
              }}
              className="border border-[#E7EAF0] rounded-lg bg-white py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3B5BFF]/20 shadow-xs cursor-pointer min-w-[190px]"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
              Comparing Against
            </label>
            <div className="flex flex-wrap items-center gap-1.5 border border-[#E7EAF0] bg-white rounded-lg p-1.5 min-w-[280px]">
              {selectedPeers.map((peer) => (
                <span
                  key={peer.id}
                  className="inline-flex items-center gap-1.5 bg-[#EEF1FF] text-[#3B5BFF] text-[11.5px] font-bold px-2.5 py-1 rounded-full"
                >
                  {peer.name}
                  {selectedPeers.length > 1 && (
                    <button
                      onClick={() => handleRemovePeer(peer.id)}
                      className="hover:text-red-600 transition-colors font-semibold"
                      title="Remove peer"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}

              {/* Add Peer Chip Button */}
              {availablePeersToAdd.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setIsAddPeerOpen(!isAddPeerOpen)}
                    className="inline-flex items-center gap-1 bg-transparent border border-dashed border-[#C7CEDD] text-slate-500 hover:text-slate-800 text-[11.5px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                  >
                    + Add peer
                  </button>

                  {/* Add Peer Dropdown Popup */}
                  {isAddPeerOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                        Available Peer Hospitals
                      </div>
                      {availablePeersToAdd.map((peer) => (
                        <button
                          key={peer.id}
                          onClick={() => handleAddPeer(peer.id)}
                          className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-between"
                        >
                          <span>{peer.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{peer.shortCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-white border border-[#E7EAF0] rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-[#EEF1FF] text-[#3B5BFF] flex items-center justify-center font-bold text-base flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <b className="text-sm font-bold text-slate-900 block">Peer Group Intelligence Panel</b>
            <span className="text-xs text-slate-500">
              Metropolitan Hospital vs. {selectedPeers.length} peer hospitals, {selectedDept.name}.
            </span>
          </div>
        </div>

        <div className="text-left md:text-right flex-shrink-0">
          <div className="text-xl md:text-2xl font-bold text-[#E23744] font-mono">{aheadCategoriesCount} of 5</div>
          <div className="text-[10.5px] text-slate-500 font-semibold uppercase tracking-wider">
            categories ahead of peer avg
          </div>
        </div>
      </div>

      {/* Chart Panel */}
      <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 shadow-xs">
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900">Score Comparison</h2>
          <p className="text-xs text-slate-500 mt-1">
            Your hospital (dark bar) against each peer, per category.
          </p>
        </div>

        {/* 5 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-0">
          {[
            { key: 'Overall', label: 'Overall Quality', weight: 'Composite' },
            { key: 'Outcome', label: 'Outcome', weight: 'Weight: 30%' },
            { key: 'Structure', label: 'Structure', weight: 'Weight: 25%' },
            { key: 'Process', label: 'Process', weight: 'Weight: 25%' },
            { key: 'Patient Exp', label: 'Experience', weight: 'Weight: 20%' },
          ].map((cat, idx) => {
            const myScore = myCategoryScores[cat.key] || 0;

            return (
              <div
                key={cat.key}
                className={`p-3 md:px-4 md:py-0 ${
                  idx < 4 ? 'md:border-r md:border-slate-100' : ''
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{cat.label}</div>
                <div className="text-[10px] text-slate-400 mb-4">{cat.weight}</div>

                {/* Bars Area */}
                <div className="flex items-end justify-center gap-2 h-32 mb-3 border-b border-[#E7EAF0] pb-0">
                  {/* Metropolitan Hospital Bar ("You") */}
                  <div className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[10.5px] font-bold text-slate-900 mb-1 font-mono">
                      {myScore}
                    </span>
                    <div
                      className="w-full max-w-[26px] rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(10, Math.min(100, myScore))}%`, backgroundColor: MY_COLOR }}
                    ></div>
                  </div>

                  {/* Peer Bars */}
                  {peersCategoryScores.map(({ peer, scores }, peerIdx) => {
                    const peerScore = scores[cat.key] || 0;

                    return (
                      <div key={peer.id} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[10.5px] font-bold text-slate-500 mb-1 font-mono">
                          {peerScore}
                        </span>
                        <div
                          className="w-full max-w-[26px] rounded-t-md transition-all duration-300"
                          style={{ height: `${Math.max(10, Math.min(100, peerScore))}%`, backgroundColor: PEER_COLORS[peerIdx % PEER_COLORS.length] }}
                        ></div>
                      </div>
                    );
                  })}
                </div>

                {/* Bar Foot Labels */}
                <div className="flex gap-2 text-center text-[9.5px] font-bold text-slate-500 tracking-wider">
                  <span className="flex-1" style={{ color: MY_COLOR }}>You</span>
                  {selectedPeers.map((peer) => (
                    <span key={peer.id} className="flex-1 text-slate-500">
                      {peer.shortCode}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-[#E7EAF0] text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded inline-block" style={{ backgroundColor: MY_COLOR }}></span>
            <span>Your hospital</span>
          </div>
          {selectedPeers.map((peer, peerIdx) => (
            <div key={peer.id} className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded inline-block" style={{ backgroundColor: PEER_COLORS[peerIdx % PEER_COLORS.length] }}></span>
              <span>{peer.shortCode}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Metric-Level Comparison</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your value vs. each peer hospital, with the difference shown as an arrow.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-[#F1F2F6] rounded-xl p-1 self-start sm:self-auto">
            {['All', 'Outcome', 'Structure', 'Process', 'Experience'].map((tab) => {
              const isActive = activeTableTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTableTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E7EAF0]">
                <th className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider pb-3 px-3 w-[26%]">
                  Metric
                </th>
                <th className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider pb-3 px-3 text-center">
                  Your Hospital
                </th>
                {selectedPeers.map((peer) => (
                  <th
                    key={peer.id}
                    className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider pb-3 px-3 text-center"
                  >
                    {peer.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMetrics.map((metric) => {
                const myValue = selectedDept.metrics[metric.id] ?? metric.min;

                return (
                  <tr key={metric.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Metric Name */}
                    <td className="py-3.5 px-3 text-xs md:text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryDotColor(metric.category) }}
                        ></span>
                        <span>{metric.name}</span>
                      </div>
                    </td>

                    {/* Your Hospital Value */}
                    <td className="py-3.5 px-3 text-center text-xs md:text-sm font-bold text-slate-900 font-mono">
                      {formatMetricValue(myValue, metric.unit)}
                    </td>

                    {/* Peer Columns */}
                    {peersCategoryScores.map(({ peer, metrics }, peerIdx) => {
                      const peerVal = metrics[metric.id] ?? metric.min;
                      const peerColor = PEER_COLORS[peerIdx % PEER_COLORS.length];

                      // Delta calculation
                      const rawDelta = peerVal - myValue;
                      const isPeerHigher = rawDelta > 0;
                      const isPeerLower = rawDelta < 0;
                      const absDelta = Math.abs(rawDelta);

                      const formattedPeerVal = formatMetricValue(peerVal, metric.unit);
                      const formattedDeltaStr =
                        metric.unit === '%'
                          ? `${absDelta.toFixed(1)}`
                          : metric.unit === 'FTE'
                          ? `${absDelta.toFixed(2)}`
                          : `${absDelta.toFixed(0)}`;

                      return (
                        <td key={peer.id} className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-slate-500 font-mono min-w-[50px] text-right">
                              {formattedPeerVal}
                            </span>

                            {/* Arrow Pill */}
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono"
                              style={{ color: peerColor, backgroundColor: `${peerColor}1A` }}
                            >
                              {isPeerHigher ? (
                                <>
                                  <ArrowUp className="w-3 h-3" /> +{formattedDeltaStr}
                                </>
                              ) : isPeerLower ? (
                                <>
                                  <ArrowDown className="w-3 h-3" /> -{formattedDeltaStr}
                                </>
                              ) : (
                                <>
                                  — 0
                                </>
                              )}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-[#E7EAF0] text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 text-[10.5px] font-bold px-1.5 py-0.5 rounded">
              ↑
            </span>
            <span>This peer is performing higher than your hospital</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 text-[10.5px] font-bold px-1.5 py-0.5 rounded">
              ↓
            </span>
            <span>This peer is performing lower than your hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
