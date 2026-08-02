import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { useChartColors } from './chartTheme';
import ChartTooltip from './ChartTooltip';
import { formatCurrency } from '../../utils/format';

/** A compact two-bar comparison. Category axis labels ("Income"/"Expense")
 *  are the identity channel; color reinforces, and 4px-rounded bar ends sit
 *  on the baseline per the mark spec. */
export default function IncomeVsExpenseChart({ income = 0, expense = 0 }) {
  const c = useChartColors();
  const data = [
    { name: 'Income', value: income, fill: c.income },
    { name: 'Expense', value: expense, fill: c.expense },
  ];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fill: c.text, fontSize: 12 }} tickLine={false} axisLine={{ stroke: c.grid }} />
        <YAxis
          tick={{ fill: c.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: c.grid, fillOpacity: 0.3 }} />
        <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]} maxBarSize={90}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
