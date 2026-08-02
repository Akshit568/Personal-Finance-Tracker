import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  ArrowUpDown,
  Pencil,
  Trash2,
  Filter,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import clsx from 'clsx';
import Layout from '../components/Layout';
import { Card, Button, Input, Select, Badge, LoadingBlock, EmptyState } from '../components/ui';
import Pagination from '../components/Pagination';
import Modal, { ConfirmDialog } from '../components/Modal';
import { transactionsApi } from '../api/transactions';
import { categoriesApi } from '../api/categories';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, todayISO } from '../utils/format';
import { PAGE_SIZE } from '../utils/constants';

const SORTABLE = [
  { key: 'transaction_date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'type', label: 'Type' },
  { key: 'created_at', label: 'Created' },
];

const EMPTY_FILTERS = {
  search: '',
  type: '',
  category_id: '',
  startDate: '',
  endDate: '',
};

export default function Transactions() {
  const { canWrite } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('transaction_date');
  const [order, setOrder] = useState('desc');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [editing, setEditing] = useState(null); // transaction or {} for new
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debounceRef = useRef();

  // Load categories once (for filter + form).
  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { rows, meta } = await transactionsApi.list({
        page,
        limit: PAGE_SIZE,
        sortBy,
        order,
        ...filters,
      });
      setRows(rows);
      setMeta(meta);
    } catch (err) {
      toast.error(err.apiMessage || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, order, filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce the search box into filters.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setFilters((f) => ({ ...f, search: searchInput }));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const toggleSort = (key) => {
    if (sortBy === key) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setOrder('desc');
    }
    setPage(1);
  };

  const applyFilter = (patch) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== 'search'
  ).length;

  const handleSaved = () => {
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await transactionsApi.remove(deleting.id);
      toast.success('Transaction deleted');
      setDeleting(null);
      // If we deleted the last row on a page, step back.
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      toast.error(err.apiMessage || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const catName = (id) => categories.find((c) => c.id === id)?.name;

  return (
    <Layout title="Transactions">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search description…"
            className="pl-9"
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowFilters((v) => !v)}
          className={clsx(activeFilterCount && 'border-brand-400 text-brand-600')}
        >
          <Filter size={16} /> Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-600 px-1 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {canWrite && (
          <Button onClick={() => setEditing({})}>
            <Plus size={16} /> Add transaction
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="mb-4 animate-fade-in p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Type</span>
              <Select value={filters.type} onChange={(e) => applyFilter({ type: e.target.value })}>
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Category</span>
              <Select value={filters.category_id} onChange={(e) => applyFilter({ category_id: e.target.value })}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">From</span>
              <Input type="date" value={filters.startDate} onChange={(e) => applyFilter({ startDate: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">To</span>
              <Input type="date" value={filters.endDate} onChange={(e) => applyFilter({ endDate: e.target.value })} />
            </label>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-rose-600">
                <X size={14} /> Clear filters
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <LoadingBlock label="Loading transactions…" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No transactions found"
            description={activeFilterCount || filters.search ? 'Try adjusting your search or filters.' : 'Add your first transaction to get started.'}
            action={canWrite && !activeFilterCount && !filters.search ? <Button onClick={() => setEditing({})}><Plus size={16} /> Add transaction</Button> : null}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <Th onClick={() => toggleSort('transaction_date')} active={sortBy === 'transaction_date'} order={order}>Date</Th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <Th onClick={() => toggleSort('type')} active={sortBy === 'type'} order={order}>Type</Th>
                    <Th onClick={() => toggleSort('amount')} active={sortBy === 'amount'} order={order} className="text-right">Amount</Th>
                    {canWrite && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(t.transaction_date)}</td>
                      <td className="max-w-[280px] truncate px-4 py-3 text-slate-800 dark:text-slate-100">{t.description || <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-3">
                        {t.category_name || catName(t.category_id) ? (
                          <Badge color="slate">{t.category_name || catName(t.category_id)}</Badge>
                        ) : (
                          <span className="text-slate-400">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TypePill type={t.type} />
                      </td>
                      <td className={clsx('tnum whitespace-nowrap px-4 py-3 text-right font-medium', t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                        {t.type === 'income' ? '+' : '−'}
                        {formatCurrency(t.amount)}
                      </td>
                      {canWrite && (
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <IconBtn onClick={() => setEditing(t)} label="Edit"><Pencil size={15} /></IconBtn>
                            <IconBtn onClick={() => setDeleting(t)} label="Delete" danger><Trash2 size={15} /></IconBtn>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {rows.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-full', t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400')}>
                    {t.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{t.description || 'No description'}</p>
                    <p className="text-xs text-slate-400">{formatDate(t.transaction_date)} · {t.category_name || catName(t.category_id) || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right">
                    <p className={clsx('tnum text-sm font-semibold', t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                      {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                    </p>
                    {canWrite && (
                      <div className="mt-1 flex justify-end gap-1">
                        <IconBtn onClick={() => setEditing(t)} label="Edit"><Pencil size={14} /></IconBtn>
                        <IconBtn onClick={() => setDeleting(t)} label="Delete" danger><Trash2 size={14} /></IconBtn>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPage={setPage} />
          </>
        )}
      </Card>

      {editing && (
        <TransactionForm
          transaction={editing.id ? editing : null}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete transaction"
        message={`Delete "${deleting?.description || 'this transaction'}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
function Th({ children, onClick, active, order, className }) {
  return (
    <th className={clsx('px-4 py-3 font-medium', className)}>
      <button onClick={onClick} className={clsx('inline-flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200', active && 'text-brand-600 dark:text-brand-400')}>
        {children}
        <ArrowUpDown size={12} className={clsx(active ? 'opacity-100' : 'opacity-30')} />
      </button>
    </th>
  );
}

function TypePill({ type }) {
  return type === 'income' ? (
    <Badge color="green"><ArrowUpCircle size={12} /> Income</Badge>
  ) : (
    <Badge color="red"><ArrowDownCircle size={12} /> Expense</Badge>
  );
}

function IconBtn({ children, onClick, label, danger }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx(
        'grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors',
        danger ? 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40' : 'hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit form modal                                           */
/* ------------------------------------------------------------------ */
function TransactionForm({ transaction, categories, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = !!transaction;
  const [form, setForm] = useState(() => ({
    type: transaction?.type || 'expense',
    amount: transaction?.amount != null ? String(transaction.amount) : '',
    category_id: transaction?.category_id ? String(transaction.category_id) : '',
    description: transaction?.description || '',
    transaction_date: transaction?.transaction_date
      ? String(transaction.transaction_date).slice(0, 10)
      : todayISO(),
  }));
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Categories filtered to the chosen type help keep data clean.
  const typeCategories = categories.filter((c) => c.type === form.type);

  const submit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(form.amount);
    if (!(amountNum > 0)) {
      toast.error('Amount must be greater than 0');
      return;
    }
    const payload = {
      type: form.type,
      amount: amountNum,
      description: form.description || null,
      transaction_date: form.transaction_date,
      category_id: form.category_id ? Number(form.category_id) : null,
    };
    setLoading(true);
    try {
      if (isEdit) {
        await transactionsApi.update(transaction.id, payload);
        toast.success('Transaction updated');
      } else {
        await transactionsApi.create(payload);
        toast.success('Transaction created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.apiMessage || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit transaction' : 'Add transaction'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading} form="tx-form">{isEdit ? 'Save changes' : 'Create'}</Button>
        </>
      }
    >
      <form id="tx-form" onSubmit={submit} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t, category_id: '' }))}
              className={clsx(
                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors',
                form.type === t
                  ? t === 'income'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              {t === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />} {t}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount <span className="text-rose-500">*</span></span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <Input type="number" step="0.01" min="0" required value={form.amount} onChange={set('amount')} placeholder="0.00" className="pl-7" />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</span>
          <Select value={form.category_id} onChange={set('category_id')}>
            <option value="">Uncategorized</option>
            {typeCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date <span className="text-rose-500">*</span></span>
          <Input type="date" required value={form.transaction_date} onChange={set('transaction_date')} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</span>
          <Input value={form.description} onChange={set('description')} placeholder="e.g. Weekly groceries" maxLength={1000} />
        </label>
      </form>
    </Modal>
  );
}
