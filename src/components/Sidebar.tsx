/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Building2, Award, ShieldAlert, Heart, Activity, ArrowLeftRight, Globe2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'home', name: 'Home', icon: Home, badge: null },
    { id: 'hospitals', name: 'Hospitals', icon: Building2, badge: 'New' },
    { id: 'compare', name: 'Quality / Compare', icon: ArrowLeftRight, badge: null },
  ];

  return (
    <div id="app-sidebar" className="fixed top-0 left-0 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider uppercase text-slate-100">US Hospital News</h1>
          <p className="text-[10px] text-slate-400 font-mono">HOSPITAL OS v3.2</p>
        </div>
      </div>

      {/* Hospital Identity Profile */}
      <div className="p-4 mx-4 my-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
            MH
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold truncate text-slate-200">Metropolitan Hospital</h2>
            <p className="text-[10px] text-slate-400 truncate">ID: #440192 - Midsize</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-700/30 flex items-center justify-between text-[10px] text-slate-400">
          <span>License State: Active</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Live Connection
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${isActive
                  ? 'bg-slate-800 text-white border-r-4 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/20 text-blue-400">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Details */}
      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono space-y-1">
        <p>Operational Comparison</p>
        <p className="text-slate-600">Ref: FY2026-Q3 Standard</p>
      </div>
    </div>
  );
}
