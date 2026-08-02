import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tags, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import clsx from 'clsx';
import Layout from '../components/Layout';
import { Card, CardHeader, Button, Input, Select, Badge, LoadingBlock, EmptyState } from '../components/ui';
import Modal, { ConfirmDialog } from '../components/Modal';
import { categoriesApi } from '../api/categories';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Categories() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await categoriesApi.list());
    } catch (err) {
      toast.error(err.apiMessage || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const income = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await categoriesApi.remove(deleting.id);
      toast.success('Category deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.apiMessage || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const Group = ({ title, items, icon: Icon, accent }) => (
    <Card>
      <CardHeader
        title={title}
        subtitle={`${items.length} ${items.length === 1 ? 'category' : 'categories'}`}
      />
      {items.length === 0 ? (
        <EmptyState icon={Tags} title="None yet" />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              <span className={clsx('grid h-8 w-8 place-items-center rounded-lg', accent)}>
                <Icon size={16} />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleting(c)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  return (
    <Layout title="Categories">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isAdmin ? 'Manage the categories available across the app.' : 'Browse the available categories.'}
        </p>
        {isAdmin && (
          <Button onClick={() => setEditing({})}>
            <Plus size={16} /> Add category
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingBlock label="Loading categories…" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Group title="Income" items={income} icon={ArrowUpCircle} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" />
          <Group title="Expense" items={expense} icon={ArrowDownCircle} accent="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" />
        </div>
      )}

      {editing && (
        <CategoryForm
          category={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete category"
        message={`Delete "${deleting?.name}"? Transactions using it will become uncategorized.`}
        confirmLabel="Delete"
      />
    </Layout>
  );
}

function CategoryForm({ category, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = !!category;
  const [form, setForm] = useState({ name: category?.name || '', type: category?.type || 'expense' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await categoriesApi.update(category.id, form);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(form);
        toast.success('Category created');
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
      title={isEdit ? 'Edit category' : 'Add category'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading}>{isEdit ? 'Save' : 'Create'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name <span className="text-rose-500">*</span></span>
          <Input required value={form.name} onChange={set('name')} placeholder="e.g. Groceries" maxLength={80} autoFocus />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</span>
          <Select value={form.type} onChange={set('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
        </label>
      </form>
    </Modal>
  );
}
