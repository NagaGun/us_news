/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CATEGORY_WEIGHTS } from '../data';
import { Award, ShieldAlert, Heart, TrendingUp, TrendingDown, Layers, Zap, ThumbsUp } from 'lucide-react';

interface MetricCardsProps {
  categoryScores: { [category: string]: number };
  compositeScore: number;
}

export default function MetricCards({ categoryScores, compositeScore }: MetricCardsProps) {
  // Get letter grade based on score
  const getLetterGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', text: 'Excellent', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
    if (score >= 80) return { grade: 'B', text: 'Proficient', color: 'text-blue-700 bg-blue-50 border-blue-100' };
    if (score >= 70) return { grade: 'C', text: 'Marginal', color: 'text-amber-700 bg-amber-50 border-amber-100' };
    return { grade: 'D', text: 'Critical', color: 'text-rose-700 bg-rose-50 border-rose-100' };
  };

  const gradeInfo = getLetterGrade(compositeScore);

  const cards = [
    {
      id: 'overall',
      title: 'Overall Quality',
      subtitle: `Grade ${gradeInfo.grade} • ${gradeInfo.text}`,
      score: compositeScore,
      icon: Award,
      weightText: 'Composite Index',
      isOverall: true,
      colorClass: 'blue',
      progressBg: 'bg-blue-500',
    },
    {
      id: 'Outcome',
      title: 'Outcome Score',
      subtitle: 'Mortality & Discharge',
      score: categoryScores.Outcome,
      icon: Heart,
      weightText: `Weight: ${CATEGORY_WEIGHTS.Outcome}%`,
      isOverall: false,
      colorClass: 'teal',
      progressBg: 'bg-emerald-500',
    },
    {
      id: 'Structure',
      title: 'Structure Score',
      subtitle: 'Staffing & Capacity',
      score: categoryScores.Structure,
      icon: Layers,
      weightText: `Weight: ${CATEGORY_WEIGHTS.Structure}%`,
      isOverall: false,
      colorClass: 'indigo',
      progressBg: 'bg-indigo-500',
    },
    {
      id: 'Process',
      title: 'Process Score',
      subtitle: 'Consults & Transparency',
      score: categoryScores.Process,
      icon: Zap,
      weightText: `Weight: ${CATEGORY_WEIGHTS.Process}%`,
      isOverall: false,
      colorClass: 'purple',
      progressBg: 'bg-purple-500',
    },
    {
      id: 'Patient Exp',
      title: 'Patient Experience',
      subtitle: 'HCAHPS Satisfaction',
      score: categoryScores['Patient Exp'],
      icon: ThumbsUp,
      weightText: `Weight: ${CATEGORY_WEIGHTS['Patient Exp']}%`,
      isOverall: false,
      colorClass: 'sky',
      progressBg: 'bg-sky-500',
    },
  ];

  return (
    <div id="metric-cards-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isHigh = card.score >= 85;
        const isCritical = card.score < 75;

        let scoreBadgeColor = 'text-blue-700 bg-blue-50 border-blue-100';
        let progressBgColor = card.progressBg;

        if (card.isOverall) {
          if (card.score >= 90) {
            scoreBadgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
            progressBgColor = 'bg-emerald-500';
          } else if (card.score >= 80) {
            scoreBadgeColor = 'text-blue-700 bg-blue-50 border-blue-100';
            progressBgColor = 'bg-blue-500';
          } else if (card.score >= 70) {
            scoreBadgeColor = 'text-amber-700 bg-amber-50 border-amber-100';
            progressBgColor = 'bg-amber-500';
          } else {
            scoreBadgeColor = 'text-rose-700 bg-rose-50 border-rose-100';
            progressBgColor = 'bg-rose-500';
          }
        } else {
          if (isHigh) {
            scoreBadgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
            progressBgColor = 'bg-emerald-500';
          } else if (isCritical) {
            scoreBadgeColor = 'text-rose-700 bg-rose-50 border-rose-100';
            progressBgColor = 'bg-rose-500';
          } else {
            scoreBadgeColor = 'text-amber-700 bg-amber-50 border-amber-100';
            progressBgColor = 'bg-amber-500';
          }
        }

        return (
          <div
            id={`metric-card-${card.id.replace(' ', '-')}`}
            key={card.id}
            className={`rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between group h-full shadow-2xs ${
              card.isOverall 
                ? 'bg-slate-900 border-slate-800 text-white' 
                : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-900'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg text-xs ${
                    card.isOverall 
                      ? 'bg-blue-500/15 text-blue-400' 
                      : 'bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                  } transition-colors`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className={`text-[11px] font-bold tracking-tight ${
                      card.isOverall ? 'text-slate-100' : 'text-slate-900'
                    }`}>{card.title}</h3>
                    <p className="text-[9px] text-slate-400 font-semibold font-mono">{card.weightText}</p>
                  </div>
                </div>

                <span className={`text-sm font-black px-2 py-0.5 rounded-md border leading-none ${
                  card.isOverall 
                    ? 'text-white bg-slate-800 border-slate-700' 
                    : scoreBadgeColor
                }`}>
                  {card.score.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className={`w-full h-1 rounded-full mb-2 overflow-hidden ${
                card.isOverall ? 'bg-slate-850' : 'bg-slate-100'
              }`}>
                <div
                  className={`h-full ${progressBgColor} transition-all duration-500 ease-out`}
                  style={{ width: `${card.score}%` }}
                ></div>
              </div>
            </div>

            {/* Subtitle/Status Footer */}
            <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider ${
              card.isOverall ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <span className={card.isOverall ? 'text-slate-400' : 'text-slate-500'}>
                {card.subtitle}
              </span>
              {!card.isOverall && (
                <span className={
                  isHigh ? 'text-emerald-600' : isCritical ? 'text-rose-500' : 'text-amber-600'
                }>
                  {isHigh ? 'Optimal' : isCritical ? 'Critical' : 'Moderate'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
