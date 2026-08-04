import type { ReactNode } from 'react';

interface ComplexityCardProps {
  title: string;
  value: string;
  confidence: number;
  color: string;
  children?: ReactNode;
  className?: string;
}

export function ComplexityCard({ title, value, confidence, color, children, className = '' }: ComplexityCardProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/80 p-5 backdrop-blur-md transition-all hover:border-indigo-500/50 dark:border-slate-700 dark:bg-slate-950/70',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</span>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300 dark:bg-slate-800/80 dark:text-slate-200">
          {Math.round(confidence)}% Confidence
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <h2 className={`text-4xl font-extrabold tracking-tight ${color}`}>{value}</h2>
      </div>
      {children && <div className="mt-4 text-sm text-slate-300 dark:text-slate-300">{children}</div>}
    </div>
  );
}

export default ComplexityCard;