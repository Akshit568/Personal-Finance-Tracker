import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartColors } from './chartTheme';
import ChartTooltip from './ChartTooltip';
import { formatCurrency } from '../../utils/format';

/** Income vs expense over the months of a year. Two series, so a legend is
 *  always present and the semantic names ("Income"/"Expense") provide the
 *  secondary encoding the palette requires. */
export default function MonthlyTrendChart({ data }) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.income} stopOpacity={0.25} />
            <stop offset="100%" stopColor={c.income} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.expense} stopOpacity={0.25} />
            <stop offset="100%" stopColor={c.expense} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="month" tick={{ fill: c.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: c.grid }} />
        <YAxis
          tick={{ fill: c.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.axis, strokeWidth: 1 }} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: c.text }}
        />
        <Area
          type="monotone"
          dataKey="income"
          name="Income"
          stroke={c.income}
          strokeWidth={2}
          fill="url(#gIncome)"
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Expense"
          stroke={c.expense}
          strokeWidth={2}
          fill="url(#gExpense)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
