import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Wallet, Receipt, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { Card, CardHeader, Select, LoadingBlock, EmptyState, Button } from '../components/ui';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import CategoryBreakdownChart from '../components/charts/CategoryBreakdownChart';
import IncomeVsExpenseChart from '../components/charts/IncomeVsExpenseChart';
import { analyticsApi } from '../api/analytics';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function Dashboard() {
  const toast = useToast();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.summary(year);
      setData(res);
    } catch (err) {
      toast.error(err.apiMessage || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [year, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals;
  const breakdown = data?.categoryBreakdown?.data || [];
  const monthly = data?.monthlyTrend?.data || [];
  const hasData = totals && totals.transactionCount > 0;

  return (
    <Layout title="Dashboard">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your financial overview{data ? '' : ''}.
        </p>
        <div className="flex items-center gap-2">
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32">
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Button variant="secondary" size="icon" onClick={load} title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <LoadingBlock label="Loading your dashboard…" />
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total income" value={formatCurrency(totals?.totalIncome)} icon={TrendingUp} accent="income" />
            <StatCard label="Total expense" value={formatCurrency(totals?.totalExpense)} icon={TrendingDown} accent="expense" />
            <StatCard
              label="Balance"
              value={formatCurrency(totals?.balance)}
              icon={Wallet}
              accent={totals?.balance >= 0 ? 'brand' : 'expense'}
              sublabel={totals?.balance >= 0 ? 'Net positive' : 'Net negative'}
            />
            <StatCard label="Transactions" value={totals?.transactionCount ?? 0} icon={Receipt} accent="neutral" />
          </div>

          {!hasData ? (
            <Card className="mt-6">
              <EmptyState
                icon={Receipt}
                title="No data for this period"
                description="Add some transactions to see your analytics come to life."
              />
            </Card>
          ) : (
            <>
              {/* Trend */}
              <Card className="mt-6">
                <CardHeader title="Monthly trend" subtitle={`Income vs expense across ${year}`} />
                <div className="p-4">
                  <MonthlyTrendChart data={monthly} />
                </div>
              </Card>

              {/* Breakdown + comparison */}
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                  <CardHeader title="Spending by category" subtitle="Where your expenses go" />
                  <div className="p-5">
                    {breakdown.length ? (
                      <CategoryBreakdownChart data={breakdown} />
                    ) : (
                      <EmptyState icon={Receipt} title="No expenses yet" />
                    )}
                  </div>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader title="Income vs expense" subtitle="Overall comparison" />
                  <div className="p-5">
                    <IncomeVsExpenseChart income={totals?.totalIncome} expense={totals?.totalExpense} />
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
