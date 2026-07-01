/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PeerGroup, DepartmentData } from '../types';
import { PEER_GROUPS, DEPARTMENTS } from '../data';
import { Users, LayoutDashboard, Sliders, RotateCcw, Activity } from 'lucide-react';

interface TopBarProps {
  selectedPeerGroup: PeerGroup;
  setSelectedPeerGroup: (pg: PeerGroup) => void;
  selectedDept: DepartmentData;
  setSelectedDept: (dept: DepartmentData) => void;
  onResetSimulation: () => void;
  isSimulated: boolean;
}

export default function TopBar({
  selectedPeerGroup,
  setSelectedPeerGroup,
  selectedDept,
  setSelectedDept,
  onResetSimulation,
  isSimulated,
}: TopBarProps) {
  return (
    <header id="dashboard-header" className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sticky top-0 z-20 shadow-xs">
      {/* Page Title & Department Info */}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
          <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
          <span>Operational Dashboard</span>
          <div className="h-3.5 w-px bg-slate-200"></div>
          <span className="text-blue-600 font-bold">Active Analytics</span>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          {selectedDept.name} Performance
          {isSimulated && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700 animate-pulse gap-1">
              <Sliders className="w-3 h-3" />
              Simulated Mode
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">{selectedDept.description}</p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Department Selector */}
        <div className="flex flex-col">
          <label htmlFor="dept-selector" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
            Clinical Department
          </label>
          <select
            id="dept-selector"
            value={selectedDept.id}
            onChange={(e) => {
              const dept = DEPARTMENTS.find((d) => d.id === e.target.value);
              if (dept) setSelectedDept(dept);
            }}
            className="bg-blue-50 hover:bg-blue-100/80 border border-blue-100 rounded-lg text-xs font-bold text-blue-700 py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Peer Group Selector */}
        <div className="flex flex-col">
          <label htmlFor="peer-group-selector" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
            Benchmark Peer Group
          </label>
          <div className="relative">
            <select
              id="peer-group-selector"
              value={selectedPeerGroup.id}
              onChange={(e) => {
                const pg = PEER_GROUPS.find((p) => p.id === e.target.value);
                if (pg) setSelectedPeerGroup(pg);
              }}
              className="bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
            >
              {PEER_GROUPS.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name} (x{(pg.targetModifier).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Simulation Button */}
        {isSimulated && (
          <button
            id="btn-reset-simulation"
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 self-end py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-all shadow-xs"
            title="Reset simulated sliders to department baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        )}
      </div>
    </header>
  );
}
