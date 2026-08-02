import clsx from 'clsx';
import { Card } from './ui';

/** KPI stat tile. The value is the headline — big, tabular, high-contrast ink.
 *  Color is used only on the small icon chip, never to carry the number. */
export default function StatCard({ label, value, icon: Icon, accent = 'brand', sublabel }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400',
    income: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    expense: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="tnum mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', accents[accent])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}
