/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  GitCompare,
  Stethoscope,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Lock,
  Sparkles,
  Database,
  Users,
  Building2,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

/* ─── tiny animated counter hook ─── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

/* ─── bar helper ─── */
function MiniBar({ height, color, label }: { height: number; color: string; label: string }) {
  return (
    <div className="lp-bar-wrapper">
      <div className="lp-bar" style={{ height: `${height}%`, background: color }} />
      <span className="lp-bar-label">{label}</span>
    </div>
  );
}

/* ─── delta pill ─── */
function DeltaPill({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className={`lp-delta-pill ${positive ? 'lp-delta-green' : 'lp-delta-red'}`}>
      {positive ? '↑' : '↓'} {value}
    </span>
  );
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const systems = useCountUp(240);
  const records = useCountUp(18);
  const [mockStaffing, setMockStaffing] = useState(6.0);
  const mockOutcome = Math.min(100, Math.max(0, 73 + (mockStaffing - 6.0) * 5));

  return (
    <div className="lp-root">
      <style>{`
        /* ══════════════════════════════════════════
           LANDING PAGE — ALL SCOPED STYLES
        ══════════════════════════════════════════ */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --lp-navy:    #0B1526;
          --lp-navy2:   #101d33;
          --lp-blue:    #3B5BFF;
          --lp-blue-lt: #EEF1FF;
          --lp-ink:     #0F172A;
          --lp-sub:     #64748B;
          --lp-line:    #E7EAF0;
          --lp-bg:      #F6F7FA;
          --lp-green:   #0F9D58;
          --lp-green-bg:#E7F8EE;
          --lp-red:     #E23744;
          --lp-red-bg:  #FDEDED;
        }

        .lp-root {
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--lp-bg);
          color: var(--lp-ink);
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--lp-line);
          width: 100%;
        }
        .lp-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 60px;
          width: 100%;
        }
        .lp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lp-logo-mark {
          width: 32px; height: 32px;
          background: var(--lp-blue);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 900; font-size: 15px;
        }
        .lp-logo-text {
          font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase;
          color: var(--lp-ink);
        }
        .lp-nav-demo {
          background: var(--lp-ink);
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 9px 22px;
          font-size: 12px; font-weight: 700;
          letter-spacing: .06em; text-transform: uppercase;
          cursor: pointer;
          transition: background .18s, transform .14s;
        }
        .lp-nav-demo:hover { background: var(--lp-blue); transform: scale(1.03); }

        /* ── HERO ── */
        .lp-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: center;
          padding: 64px 32px 56px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .lp-hero-accent {
          display: block;
          width: 36px; height: 3px;
          background: var(--lp-blue);
          border-radius: 2px;
          margin-bottom: 20px;
        }
        .lp-hero-headline {
          font-size: 44px;
          font-weight: 900;
          line-height: 1.06;
          letter-spacing: -.02em;
          color: var(--lp-ink);
          margin: 0 0 16px;
          text-transform: uppercase;
        }
        .lp-hero-sub {
          font-size: 14px;
          color: var(--lp-sub);
          line-height: 1.65;
          max-width: 440px;
          margin-bottom: 28px;
        }
        .lp-hero-ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 320px;
        }
        .lp-btn-primary {
          background: var(--lp-blue);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 22px;
          font-size: 12px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          transition: background .18s, transform .13s, box-shadow .18s;
          box-shadow: 0 4px 16px rgba(59,91,255,0.28);
        }
        .lp-btn-primary:hover {
          background: #2b4aee;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(59,91,255,0.36);
        }
        .lp-btn-secondary {
          background: transparent;
          color: var(--lp-ink);
          border: 1.5px solid var(--lp-line);
          border-radius: 8px;
          padding: 12px 22px;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          transition: border-color .18s, background .18s, transform .13s;
        }
        .lp-btn-secondary:hover {
          border-color: var(--lp-blue);
          background: var(--lp-blue-lt);
          transform: translateY(-1px);
        }
        .lp-stats {
          display: flex;
          gap: 32px;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid var(--lp-line);
        }
        .lp-stat { }
        .lp-stat-val {
          font-size: 22px; font-weight: 900; color: var(--lp-ink);
          font-variant-numeric: tabular-nums;
        }
        .lp-stat-val-green { color: var(--lp-green); }
        .lp-stat-label { font-size: 9px; font-weight: 600; color: var(--lp-sub); text-transform: uppercase; letter-spacing: .07em; margin-top: 2px; }

        /* ── HERO PREVIEW CARD ── */
        .lp-preview-card {
          background: var(--lp-navy);
          border-radius: 16px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(11,21,38,0.38), 0 4px 16px rgba(0,0,0,0.12);
          position: relative;
        }
        .lp-preview-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .lp-preview-dots { display:flex; gap:5px; }
        .lp-dot { width:9px; height:9px; border-radius:50%; }
        .lp-dot-r { background:#E23744; }
        .lp-dot-y { background:#F59E0B; }
        .lp-dot-g { background:#10B981; }
        .lp-preview-title { font-size:10px; font-weight:600; color:#94A3B8; letter-spacing:.07em; text-transform:uppercase; }
        .lp-preview-badge {
          background: rgba(59,91,255,0.2);
          color: #7B9FFF;
          font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 4px;
          text-transform: uppercase; letter-spacing:.06em;
        }
        .lp-preview-body { padding: 18px 20px; }
        .lp-preview-dept-tag {
          font-size: 8.5px; font-weight: 700; color: #60A5FA;
          text-transform: uppercase; letter-spacing: .1em;
          margin-bottom: 4px;
        }
        .lp-preview-dept-name {
          font-size: 13px; font-weight: 800; color: #F1F5F9;
          margin-bottom: 12px;
        }
        .lp-preview-scores {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 8px; margin-bottom: 14px;
        }
        .lp-score-chip {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 8px;
        }
        .lp-score-label { font-size: 8px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing:.07em; }
        .lp-score-val { font-size: 18px; font-weight: 900; color: #F1F5F9; line-height:1; margin: 4px 0; }
        .lp-score-status { font-size: 8px; font-weight: 600; }
        .lp-status-green { color: #34D399; }
        .lp-status-amber { color: #FCD34D; }
        .lp-status-red   { color: #F87171; }
        .lp-preview-rows { border-top: 1px solid rgba(255,255,255,0.07); padding-top: 14px; }
        .lp-preview-row-hdr {
          display: flex; justify-content: space-between;
          font-size: 8.5px; font-weight: 700; color: #475569;
          text-transform: uppercase; letter-spacing: .08em;
          padding: 4px 0; margin-bottom: 6px;
        }
        .lp-preview-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 10.5px;
        }
        .lp-preview-metric { color: #94A3B8; font-weight: 500; }
        .lp-preview-vals { display: flex; gap: 10px; align-items: center; }
        .lp-preview-yours { color: #F1F5F9; font-weight: 700; font-variant-numeric: tabular-nums; }
        .lp-preview-tag-pill {
          padding: 2px 7px; border-radius: 4px;
          font-size: 8.5px; font-weight: 700; text-transform: uppercase;
        }
        .lp-pill-green { background: rgba(52,211,153,0.15); color: #34D399; }
        .lp-pill-red   { background: rgba(248,113,113,0.15); color: #F87171; }
        .lp-pill-blue  { background: rgba(96,165,250,0.15); color: #60A5FA; }
        .lp-preview-footer {
          background: rgba(0,0,0,0.3);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-preview-lock { display: flex; align-items: center; gap: 5px; font-size: 9px; color: #475569; }
        .lp-preview-try { font-size: 9.5px; color: #7B9FFF; font-weight: 700; cursor: pointer; }
        .lp-preview-try:hover { color: #a3bfff; }

        /* ── SECTION ── */
        .lp-section {
          padding: 64px 0;
          border-top: 1px solid var(--lp-line);
          width: 100%;
        }
        .lp-section-inner {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 0 32px;
        }
        .lp-section-tag {
          font-size: 9.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .12em; color: var(--lp-blue);
          margin-bottom: 6px;
        }
        .lp-section-title {
          font-size: 28px; font-weight: 900; line-height: 1.1;
          letter-spacing: -.01em; text-transform: uppercase;
          color: var(--lp-ink); margin: 0 0 12px;
        }
        .lp-section-sub {
          font-size: 14px; color: var(--lp-sub);
          line-height: 1.65; max-width: 640px; margin-bottom: 32px;
        }
        .lp-section-accent { display:block; width:32px; height:3px; background:var(--lp-blue); border-radius:2px; margin-bottom:20px; }

        /* ── FEATURE 2-COL LAYOUT ── */
        .lp-feature-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 48px;
          align-items: start;
        }
        .lp-feature-copy { }
        .lp-demo-panel {
          background: #fff;
          border: 1px solid var(--lp-line);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          width: 100%;
          max-height: 400px;
          position: relative;
        }
        .lp-demo-panel::after {
          content: "";
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 80px;
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1));
          pointer-events: none;
        }

        /* ── BENCHMARK FEATURE PANEL ── */
        .lp-feature-box {
          background: #fff;
          border: 1px solid var(--lp-line);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.05);
          width: 100%;
        }
        .lp-feature-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid var(--lp-line);
          background: #FAFBFC;
        }
        .lp-feature-hdr-left { display:flex; align-items:center; gap:10px; }
        .lp-feature-hdr-title { font-size: 11.5px; font-weight: 800; color: var(--lp-ink); letter-spacing:.04em; text-transform:uppercase; }
        .lp-feature-badge {
          background: var(--lp-blue-lt);
          color: var(--lp-blue);
          font-size: 8.5px; font-weight: 700;
          padding: 3px 9px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: .06em;
          border: 1px solid rgba(59,91,255,0.15);
        }
        .lp-try-btn {
          background: var(--lp-ink);
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 8px 16px;
          font-size: 11px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          transition: background .16s, transform .13s;
        }
        .lp-try-btn:hover { background: var(--lp-blue); transform: scale(1.03); }
        .lp-feature-body { padding: 24px; }

        /* ── CATEGORY BARS ── */
        .lp-cat-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .lp-cat-col {}
        .lp-cat-title { font-size: 9.5px; font-weight: 700; color: var(--lp-sub); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 8px; }
        .lp-bars-group {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 54px;
          margin-bottom: 8px;
        }
        .lp-bar-wrapper { display:flex; flex-direction:column; align-items:center; flex:1; height:100%; justify-content:flex-end; }
        .lp-bar { width: 100%; border-radius: 4px 4px 0 0; transition: height .3s ease; }
        .lp-bar-label { font-size: 8px; font-weight: 600; color: var(--lp-sub); margin-top: 3px; }
        .lp-cat-score { font-size: 17px; font-weight: 900; color: var(--lp-ink); }
        .lp-cat-legend { font-size: 8px; color: var(--lp-sub); margin-top: 2px; }

        /* ── MATRIX TABLE ── */
        .lp-matrix-hdr {
          background: var(--lp-navy);
          border-radius: 8px 8px 0 0;
          padding: 10px 16px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .lp-matrix-hdr-title { font-size: 9px; font-weight: 800; color: #7B9FFF; text-transform: uppercase; letter-spacing: .1em; }
        .lp-matrix-hdr-sub { font-size: 8px; color: #475569; }
        .lp-matrix-table { width: 100%; border-collapse: collapse; }
        .lp-matrix-table th {
          font-size: 8.5px; font-weight: 700; color: var(--lp-sub);
          text-transform: uppercase; letter-spacing: .08em;
          padding: 10px 14px; text-align: left;
          border-bottom: 1px solid var(--lp-line);
        }
        .lp-matrix-table td {
          padding: 10px 14px; font-size: 11.5px;
          border-bottom: 1px solid #f1f5f9;
        }
        .lp-metric-name { font-weight: 600; color: var(--lp-ink); }
        .lp-metric-target { font-weight: 600; color: var(--lp-sub); font-variant-numeric: tabular-nums; }
        .lp-delta-pill { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
        .lp-delta-green { background: var(--lp-green-bg); color: var(--lp-green); }
        .lp-delta-red   { background: var(--lp-red-bg); color: var(--lp-red); }
        .lp-feature-footer {
          padding: 14px 24px;
          border-top: 1px solid var(--lp-line);
          display: flex; align-items: center; justify-content: space-between;
          background: #FAFBFC;
        }
        .lp-feature-footer-note { font-size: 10px; color: var(--lp-sub); }

        /* ── DEPT STRENGTHS SECTION ── */
        .lp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .lp-dept-panel {
          background: #fff;
          border: 1px solid var(--lp-line);
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .lp-dept-panel-hdr {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .lp-dept-panel-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--lp-ink); }
        .lp-dept-tabs { display: flex; gap: 6px; }
        .lp-dept-tab {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .05em;
          border: 1px solid var(--lp-line);
          cursor: pointer;
          transition: all .14s;
          background: transparent; color: var(--lp-sub);
        }
        .lp-dept-tab.active { background: var(--lp-blue); color: #fff; border-color: var(--lp-blue); }
        .lp-dept-scores {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 10px; margin-bottom: 16px;
        }
        .lp-dept-score-box { }
        .lp-dept-score-lbl { font-size: 8px; color: var(--lp-sub); font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }
        .lp-dept-score-val { font-size: 22px; font-weight: 900; color: var(--lp-ink); line-height: 1.1; }
        .lp-dept-score-status { font-size: 8px; font-weight: 700; margin-top: 2px; padding: 2px 6px; border-radius: 3px; display: inline-block; }
        .lp-status-stable  { background: #E7F8EE; color: var(--lp-green); }
        .lp-status-warn    { background: #FFF6E5; color: #C97C10; }
        .lp-status-high    { background: var(--lp-blue-lt); color: var(--lp-blue); }
        .lp-status-priority{ background: var(--lp-red-bg); color: var(--lp-red); }
        .lp-dept-link { font-size: 10px; color: var(--lp-sub); cursor: pointer; }
        .lp-dept-link:hover { color: var(--lp-blue); }

        /* Strengths engine box */
        .lp-strengths-box {
          background: #fff;
          border: 1.5px solid #D1FAE5;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          display: flex; flex-direction: column;
        }
        .lp-strengths-hdr {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px;
        }
        .lp-strengths-icon {
          width: 30px; height: 30px;
          background: var(--lp-green-bg);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lp-strengths-title { font-size: 11.5px; font-weight: 800; color: var(--lp-ink); }
        .lp-strengths-sub { font-size: 9px; color: var(--lp-sub); margin-top: 2px; }
        .lp-strength-row {
          padding: 10px 0;
          border-bottom: 1px solid #F0FDF4;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-strength-row:last-child { border-bottom: none; }
        .lp-strength-metric { font-size: 11px; font-weight: 600; color: var(--lp-ink); }
        .lp-strength-context { font-size: 9px; color: var(--lp-sub); margin-top: 1px; }
        .lp-strength-badge {
          background: var(--lp-green-bg);
          color: var(--lp-green);
          font-size: 11px; font-weight: 800;
          padding: 4px 9px; border-radius: 6px;
        }

        /* ── CAPABILITIES GRID ── */
        .lp-caps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .lp-cap-card {
          background: #fff;
          border: 1px solid var(--lp-line);
          border-radius: 12px;
          padding: 24px 20px;
          transition: box-shadow .18s, transform .15s, border-color .18s;
        }
        .lp-cap-card:hover {
          box-shadow: 0 6px 24px rgba(59,91,255,0.1);
          transform: translateY(-2px);
          border-color: rgba(59,91,255,0.25);
        }
        .lp-cap-icon {
          width: 36px; height: 36px;
          background: var(--lp-blue-lt);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .lp-cap-title {
          font-size: 12px; font-weight: 800;
          text-transform: uppercase; letter-spacing: .05em;
          color: var(--lp-ink);
          margin-bottom: 8px;
        }
        .lp-cap-desc { font-size: 12px; color: var(--lp-sub); line-height: 1.6; }

        /* ── DARK FOOTER CTA ── */
        .lp-footer-cta-wrapper {
          width: 100%;
          padding: 32px 0 64px;
        }
        .lp-footer-cta-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
          width: 100%;
        }
        .lp-footer-cta {
          background: var(--lp-navy);
          border-radius: 18px;
          padding: 56px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 40px;
          width: 100%;
          box-shadow: 0 16px 40px rgba(11,21,38,0.25);
        }
        .lp-footer-headline {
          font-size: 28px; font-weight: 900; line-height: 1.1;
          text-transform: uppercase; letter-spacing: -.01em;
          color: #F1F5F9; max-width: 520px;
        }
        .lp-footer-sub { font-size: 13px; color: #64748B; margin-top: 10px; max-width: 480px; }
        .lp-footer-btn {
          background: var(--lp-blue);
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 14px 28px;
          font-size: 13px; font-weight: 800;
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          white-space: nowrap;
          transition: background .18s, transform .14s, box-shadow .18s;
          box-shadow: 0 4px 20px rgba(59,91,255,0.4);
        }
        .lp-footer-btn:hover {
          background: #2b4aee;
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(59,91,255,0.5);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .lp-hero { grid-template-columns: 1fr; gap: 40px; padding: 48px 24px; }
          .lp-two-col { grid-template-columns: 1fr; }
          .lp-caps-grid { grid-template-columns: 1fr 1fr; }
          .lp-footer-cta { flex-direction: column; text-align: center; padding: 40px 28px; }
          .lp-cat-grid { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 580px) {
          .lp-hero-headline { font-size: 34px; }
          .lp-section-title { font-size: 22px; }
          .lp-preview-scores { grid-template-columns: 1fr 1fr; }
          .lp-dept-scores { grid-template-columns: 1fr 1fr; }
          .lp-caps-grid { grid-template-columns: 1fr; }
          .lp-hero { padding: 32px 16px; }
          .lp-section-inner { padding: 0 16px; }
          .lp-footer-cta-inner { padding: 0 16px; }
          .lp-nav { padding: 0 5%; }
        }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <div className="lp-logo-mark">H</div>
            <span className="lp-logo-text">US Hospital News</span>
          </div>
          <button id="nav-try-demo" className="lp-nav-demo" onClick={onEnterApp}>
            Try Demo
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="lp-hero">
        {/* Left copy */}
        <div>
          <span className="lp-hero-accent" />
          <h1 className="lp-hero-headline">
            Precision<br />Clinical<br />Intelligence.
          </h1>
          <p className="lp-hero-sub">
            Easily compare hospital performance, track patient outcomes across departments, and identify opportunities to improve clinical care.
          </p>
          <div className="lp-stats">
            <div className="lp-stat">
              <div className="lp-stat-val">{systems}+</div>
              <div className="lp-stat-label">Systems</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-val">{records}.{8}M</div>
              <div className="lp-stat-label">Records</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-val lp-stat-val-green">99.9%</div>
              <div className="lp-stat-label">CMS Feed</div>
            </div>
          </div>
        </div>

        {/* Right software preview card */}
        <div className="lp-preview-card">
          <div className="lp-preview-top">
            <div className="lp-preview-dots">
              <div className="lp-dot lp-dot-r" />
              <div className="lp-dot lp-dot-y" />
              <div className="lp-dot lp-dot-g" />
            </div>
            <span className="lp-preview-title">US Hospital News · Clinical Benchmark Platform</span>
            <span className="lp-preview-badge">Product Preview</span>
          </div>
          <div className="lp-preview-body">
            <div className="lp-preview-dept-tag">Active Specialty Unit</div>
            <div className="lp-preview-dept-name">Oncology &amp; Cardiovascular Diagnostics</div>
            <div className="lp-preview-scores">
              <div className="lp-score-chip">
                <div className="lp-score-label">Outcome Index</div>
                <div className="lp-score-val">{mockOutcome.toFixed(1)}%</div>
                <div className={`lp-score-status lp-status-green`}>▲ {(mockOutcome - 73 + 2.1).toFixed(1)} pts avg</div>
              </div>
              <div className="lp-score-chip">
                <div className="lp-score-label">Structure Index</div>
                <div className="lp-score-val">88%</div>
                <div className={`lp-score-status lp-status-amber`}>▲ 4.0 vs peers</div>
              </div>
              <div className="lp-score-chip">
                <div className="lp-score-label">Process Index</div>
                <div className="lp-score-val">65%</div>
                <div className={`lp-score-status lp-status-red`}>Priority target</div>
              </div>
              <div className="lp-score-chip">
                <div className="lp-score-label">Experience</div>
                <div className="lp-score-val">62%</div>
                <div className={`lp-score-status lp-status-red`}>Priority target</div>
              </div>
            </div>
            <div className="lp-preview-rows">
              <div className="lp-preview-row-hdr">
                <span>Interactive Simulation: Nurse Staffing</span>
                <span style={{ color: '#34D399' }}>Drag to Simulate</span>
              </div>
              <div className="lp-preview-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span className="lp-preview-metric">Specialist Nurse Staffing Ratio</span>
                  <span className="lp-preview-yours">{mockStaffing.toFixed(1)} FTE</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="10.0"
                  step="0.1"
                  value={mockStaffing}
                  onChange={(e) => setMockStaffing(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#3B5BFF', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 9, color: 'var(--lp-sub)', fontWeight: 600 }}>
                  <span>Low Staffing</span>
                  <span>Optimal Staffing</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-preview-footer">
            <div className="lp-preview-lock">
              <Lock size={10} />
              Confidential Data Encrypted &amp; Access Controlled
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURE 1: SIDE-BY-SIDE BENCHMARKING ═══ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-feature-layout">

            {/* Left copy */}
            <div className="lp-feature-copy">
              <span className="lp-section-accent" />
              <div className="lp-section-tag">Feature Preview · Peer Benchmarking</div>
              <h2 className="lp-section-title">Side-By-Side Hospital<br />Benchmarking</h2>
              <p className="lp-section-sub">
                Select any target hospital and benchmark performance across Outcome, Structure, Process, and Experience categories directly against comparative peer health systems.
              </p>
            </div>

            {/* Right demo panel */}
            <div className="lp-demo-panel">
              <div className="lp-feature-hdr">
                <div className="lp-feature-hdr-left">
                  <span className="lp-feature-hdr-title">Side-by-Side Comparative Engine</span>
                  <span className="lp-feature-badge">HIPAA &amp; Privacy Safe</span>
                </div>
              </div>
              <div className="lp-feature-body">
                {/* Legend */}
                <div style={{ marginBottom: 8, fontSize: 8.5, fontWeight: 700, color: 'var(--lp-sub)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Score Comparison by Category</span>
                  <div style={{ display: 'flex', gap: 10, fontSize: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#1E3A8A', display: 'inline-block' }} /> You</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#059669', display: 'inline-block' }} /> Peer A</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#D97706', display: 'inline-block' }} /> Peer B</span>
                  </div>
                </div>
                {/* Bars */}
                <div className="lp-cat-grid">
                  {[
                    { label: 'Overall', you: 78, peerA: 72, peerB: 84 },
                    { label: 'Outcome', you: 73, peerA: 69, peerB: 80 },
                    { label: 'Structure', you: 88, peerA: 75, peerB: 70 },
                    { label: 'Process', you: 65, peerA: 71, peerB: 78 },
                    { label: 'Experience', you: 62, peerA: 68, peerB: 82 },
                  ].map((cat) => (
                    <div key={cat.label} className="lp-cat-col">
                      <div className="lp-cat-title">{cat.label}</div>
                      <div className="lp-bars-group">
                        <MiniBar height={cat.you} color="#1E3A8A" label="You" />
                        <MiniBar height={cat.peerA} color="#059669" label="A" />
                        <MiniBar height={cat.peerB} color="#D97706" label="B" />
                      </div>
                      <div className="lp-cat-score">{cat.you}</div>
                      <div className="lp-cat-legend">Your Score</div>
                    </div>
                  ))}
                </div>
                {/* Variance matrix */}
                <div className="lp-matrix-hdr">
                  <span className="lp-matrix-hdr-title">Granular Indicator Variance Matrix</span>
                  <span className="lp-matrix-hdr-sub">Peer Delta Engine</span>
                </div>
                <table className="lp-matrix-table">
                  <thead>
                    <tr>
                      <th>Clinical Indicator</th>
                      <th>Primary Target</th>
                      <th>Peer Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="lp-metric-name">Mortality Survival Rate</span></td>
                      <td><span className="lp-metric-target">86.25</span></td>
                      <td><DeltaPill value="+2.75 Above Parity" positive={true} /></td>
                    </tr>
                    <tr>
                      <td><span className="lp-metric-name">Discharge to Home Rate</span></td>
                      <td><span className="lp-metric-target">86.45</span></td>
                      <td><span style={{ fontSize: 10, color: 'var(--lp-sub)' }}>Parity with Regional Peer</span></td>
                    </tr>
                    <tr>
                      <td><span className="lp-metric-name">Nurse Staffing Ratio</span></td>
                      <td><span className="lp-metric-target">6.0 FTE</span></td>
                      <td><DeltaPill value="−6.4 FTE Gap" positive={false} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="lp-feature-footer">
                <span className="lp-feature-footer-note">Connect your dataset securely inside the workspace</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ FEATURE 2: DEPARTMENTAL STRENGTHS ═══ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-feature-layout">

            {/* Left copy */}
            <div className="lp-feature-copy">
              <span className="lp-section-accent" />
              <div className="lp-section-tag">Feature Preview · Diagnostics &amp; Strengths</div>
              <h2 className="lp-section-title">Pinpoint Departmental<br />Strengths &amp; Flags</h2>
              <p className="lp-section-sub">
                Drill down into specialty care units — from Oncology to Emergency Care. Instantly surface top clinical strengths while targeting priority quality flags.
              </p>
            </div>

            {/* Right demo panel */}
            <div className="lp-demo-panel">
              <div className="lp-feature-hdr">
                <div className="lp-feature-hdr-left">
                  <span className="lp-feature-hdr-title">Specialty Unit Diagnostics &amp; Strengths</span>
                  <span className="lp-feature-badge">HIPAA &amp; Privacy Safe</span>
                </div>
              </div>
              <div className="lp-feature-body">
                {/* Top Section: Unit Diagnostics */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--lp-ink)' }}>Specialty Unit Diagnostics</span>
                    <div className="lp-dept-tabs">
                      {['Oncology', 'Cardiology', 'Emergency'].map((t, i) => (
                        <button key={t} className={`lp-dept-tab${i === 0 ? ' active' : ''}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="lp-dept-scores">
                    <div className="lp-dept-score-box">
                      <div className="lp-dept-score-lbl">Outcome Score</div>
                      <div className="lp-dept-score-val">72%</div>
                      <div className="lp-dept-score-status lp-status-stable">Stable · Above Avg</div>
                    </div>
                    <div className="lp-dept-score-box">
                      <div className="lp-dept-score-lbl">Structure Score</div>
                      <div className="lp-dept-score-val">64%</div>
                      <div className="lp-dept-score-status lp-status-warn">Staffing Attention</div>
                    </div>
                    <div className="lp-dept-score-box">
                      <div className="lp-dept-score-lbl">Process Score</div>
                      <div className="lp-dept-score-val">81%</div>
                      <div className="lp-dept-score-status lp-status-high">High Alignment</div>
                    </div>
                    <div className="lp-dept-score-box">
                      <div className="lp-dept-score-lbl">Patient Experience</div>
                      <div className="lp-dept-score-val">58%</div>
                      <div className="lp-dept-score-status lp-status-priority">Priority Target</div>
                    </div>
                  </div>
                  <span className="lp-dept-link" onClick={onEnterApp}>Explore all departmental indicators securely &nbsp;→</span>
                </div>

                {/* Bottom Section: Clinical Strengths Engine */}
                <div style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 10, padding: 14 }}>
                  <div className="lp-strengths-hdr" style={{ marginBottom: 10 }}>
                    <div className="lp-strengths-icon">
                      <Sparkles size={14} color="#0F9D58" />
                    </div>
                    <div>
                      <div className="lp-strengths-title">Clinical Strengths Engine</div>
                      <div className="lp-strengths-sub">Automatically isolates where your hospital outperforms peer targets.</div>
                    </div>
                  </div>
                  {[
                    { name: 'Patient Volume Index', ctx: 'High quality Throughput', badge: '+41%' },
                    { name: 'Public Transparency Index', ctx: 'Full quality Reporting', badge: '+16%' },
                    { name: 'Patient Services Diversity', ctx: 'Sub-specialty Breadth', badge: '+12%' },
                  ].map((s) => (
                    <div key={s.name} className="lp-strength-row" style={{ borderColor: 'rgba(16,185,129,0.12)' }}>
                      <div>
                        <div className="lp-strength-metric">{s.name}</div>
                        <div className="lp-strength-context">{s.ctx}</div>
                      </div>
                      <div className="lp-strength-badge">{s.badge}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-feature-footer">
                <span className="lp-feature-footer-note">Automated clinical rule engine &amp; CMS reporting alignment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PLATFORM CAPABILITIES ═══ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <span className="lp-section-accent" />
          <div className="lp-section-tag">Platform Capabilities</div>
          <h2 className="lp-section-title">Everything Your Clinical<br />Quality Team Needs</h2>
          <p className="lp-section-sub">
            From composite quality scores down to single nurse-to-patient staffing ratios — trace, compare, and simulate improvements without clunky spreadsheets.
          </p>
          <div className="lp-caps-grid">
            {[
              {
                icon: <TrendingUp size={20} color="#3B5BFF" />,
                title: 'Scenario Simulation',
                desc: 'Model the exact quality score and financial impact of proposed nurse staffing or protocol changes before committing budget.',
              },
              {
                icon: <BarChart3 size={20} color="#3B5BFF" />,
                title: 'Composite Quality Index',
                desc: 'Outcome, structure, process, and experience scores rolled up into a unified weighted clinical grade, updated live against CMS records.',
              },
              {
                icon: <GitCompare size={20} color="#3B5BFF" />,
                title: 'Peer Group Benchmarking',
                desc: 'Benchmark any department against statewide averages or select 2 to 5 peer hospitals to evaluate near-competitive variances.',
              },
              {
                icon: <Stethoscope size={20} color="#3B5BFF" />,
                title: 'Quality Diagnostics',
                desc: 'Drill into individual indicators — 30-day mortality, staffing ratios, or readmissions — and trace exactly what is driving score fluctuations.',
              },
            ].map((c) => (
              <div key={c.title} className="lp-cap-card">
                <div className="lp-cap-icon">{c.icon}</div>
                <div className="lp-cap-title">{c.title}</div>
                <div className="lp-cap-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DARK FOOTER CTA ═══ */}
      <div className="lp-footer-cta-wrapper">
        <div className="lp-footer-cta-inner">
          <div className="lp-footer-cta" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <div className="lp-footer-headline" style={{ maxWidth: '100%' }}>Ready for Precision<br />Clinical Intelligence?</div>
              <div className="lp-footer-sub" style={{ maxWidth: '100%', margin: '10px auto 0' }}>Set up your first department benchmark comparison in under ten minutes — no IT data engineering required.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
