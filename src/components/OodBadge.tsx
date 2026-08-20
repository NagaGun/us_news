import React from 'react';
import { AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { OodAssessment } from '../backendSimulation';

interface OodBadgeProps {
  assessment: OodAssessment;
}

export default function OodBadge({ assessment }: OodBadgeProps) {
  const { level, message } = assessment;

  if (!level || level === 'confident') return null;

  const isCaution = level === 'caution';

  const badgeBg = isCaution
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-red-50 text-red-800 border-red-200';
  const iconColor = isCaution ? 'text-amber-600' : 'text-red-600';
  const labelText = isCaution ? 'Unusual Inputs (Caution)' : 'Out-of-Distribution Warning';

  return (
    <div
      className={`relative group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-help transition-all ${badgeBg}`}
      title={message}
    >
      {isCaution ? (
        <AlertTriangle className={`w-4 h-4 ${iconColor}`} />
      ) : (
        <AlertOctagon className={`w-4 h-4 ${iconColor}`} />
      )}
      <span>{labelText}</span>
      <HelpCircle className="w-3.5 h-3.5 opacity-60" />

      {/* Tooltip on Hover */}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl z-50 pointer-events-none">
        <p className="font-semibold mb-1">
          {isCaution ? '⚠️ Out-of-Distribution Caution' : '🚫 Out-of-Range Extrapolation'}
        </p>
        <p>{message}</p>
      </div>
    </div>
  );
}
