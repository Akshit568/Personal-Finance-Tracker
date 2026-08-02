import { useEffect, useState, useCallback } from 'react';
import { Trash2, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Select, Badge, LoadingBlock, EmptyState } from '../components/ui';
import Pagination from '../components/Pagination';
import { ConfirmDialog } from '../components/Modal';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';
import { ROLE_LABELS, PAGE_SIZE } from '../utils/constants';

const ROLE_OPTIONS = ['admin', 'user', 'read-only'];

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { rows, meta } = await usersApi.list({ page, limit: PAGE_SIZE, role: roleFilter });
      setRows(rows);
      setMeta(meta);
    } catch (err) {
      toast.error(err.apiMessage || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (u, role) => {
    setSavingId(u.id);
    try {
      await usersApi.changeRole(u.id, role);
      toast.success(`${u.name} is now ${ROLE_LABELS[role]}`);
      setRows((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
    } catch (err) {
      toast.error(err.apiMessage || 'Could not change role');
      load();
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await usersApi.remove(deleting.id);
      toast.success('User deleted');
      setDeleting(null);
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      toast.error(err.apiMessage || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleColor = (r) => (r === 'admin' ? 'blue' : r === 'read-only' ? 'amber' : 'slate');

  return (
    <Layout title="Users">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage accounts and roles.</p>
        <Select value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }} className="w-44">
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </Select>
      </div>

      <Card>
        {loading ? (
          <LoadingBlock label="Loading users…" />
        ) : rows.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => {
                    const isSelf = u.id === me.id;
                    return (
                      <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-100">
                                {u.name} {isSelf && <span className="text-xs font-normal text-slate-400">(you)</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          {isSelf ? (
                            <Badge color={roleColor(u.role)}><ShieldCheck size={12} /> {ROLE_LABELS[u.role]}</Badge>
                          ) : (
                            <Select
                              value={u.role}
                              disabled={savingId === u.id}
                              onChange={(e) => changeRole(u, e.target.value)}
                              className="h-8 w-36 py-0 text-xs"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </Select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleting(u)}
                            disabled={isSelf}
                            aria-label="Delete user"
                            title={isSelf ? "You can't delete your own account" : 'Delete user'}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-rose-950/40"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPage={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete user"
        message={`Permanently delete ${deleting?.name}? All of their transactions will also be removed.`}
        confirmLabel="Delete user"
      />
    </Layout>
  );
}
