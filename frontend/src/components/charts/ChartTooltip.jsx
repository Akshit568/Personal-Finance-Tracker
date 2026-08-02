import { formatCurrency, formatPercent } from '../../utils/format';

/** Shared tooltip: text stays in ink tokens; a small colored dot carries the
 *  series identity (never color-on-text). */
export default function ChartTooltip({ active, payload, label, showPercent = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      {label !== undefined && (
        <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: entry.color || entry.payload?.fill }} />
          <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
          <span className="tnum ml-auto font-medium text-slate-800 dark:text-slate-100">
            {showPercent && entry.payload?.percentage !== undefined
              ? `${formatCurrency(entry.value)} · ${formatPercent(entry.payload.percentage)}`
              : formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
