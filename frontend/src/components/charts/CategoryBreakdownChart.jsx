import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useChartColors } from './chartTheme';
import ChartTooltip from './ChartTooltip';
import { formatCurrency, formatPercent } from '../../utils/format';

/** Donut of spending by category. Many categories exceed the CVD-safe count,
 *  so we cap to the top 6 and fold the rest into "Other", then reinforce with
 *  an always-present labeled legend list (identity never rests on color). */
export default function CategoryBreakdownChart({ data = [] }) {
  const c = useChartColors();

  const { slices, total } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.total - a.total);
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6);
    if (rest.length) {
      const otherTotal = rest.reduce((s, r) => s + r.total, 0);
      const otherPct = rest.reduce((s, r) => s + (r.percentage || 0), 0);
      top.push({ category: 'Other', total: otherTotal, percentage: otherPct });
    }
    const total = sorted.reduce((s, r) => s + r.total, 0);
    return { slices: top, total };
  }, [data]);

  if (!slices.length) return null;

  const colored = slices.map((s, i) => ({ ...s, name: s.category, value: s.total, fill: c.categorical[i % c.categorical.length] }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[220px] w-[220px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={colored}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={95}
              paddingAngle={2}
              stroke={c.surface}
              strokeWidth={2}
            >
              {colored.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip showPercent />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400">Total</span>
          <span className="tnum text-lg font-semibold text-slate-900 dark:text-slate-50">
            {formatCurrency(total, { compact: true })}
          </span>
        </div>
      </div>

      {/* Labeled legend / mini table — the secondary encoding */}
      <ul className="w-full flex-1 space-y-1.5">
        {colored.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.fill }} />
            <span className="truncate text-slate-600 dark:text-slate-300">{d.name}</span>
            <span className="tnum ml-auto font-medium text-slate-800 dark:text-slate-100">
              {formatCurrency(d.total)}
            </span>
            <span className="tnum w-12 text-right text-xs text-slate-400">{formatPercent(d.percentage)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
