import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Wallet, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Field, Input } from '../components/ui';

const DEMO = [
  { label: 'Admin', email: 'admin@finance.com', password: 'Admin@123' },
  { label: 'User', email: 'user@finance.com', password: 'User@123' },
  { label: 'Read-only', email: 'viewer@finance.com', password: 'Viewer@123' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.apiMessage || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const useDemo = (d) => {
    setEmail(d.email);
    setPassword(d.password);
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back — enter your credentials to continue."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" required>
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" required>
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          <LogIn size={18} /> Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-700">
        <p className="mb-2 text-center text-xs font-medium text-slate-400">Demo accounts — click to fill</p>
        <div className="flex flex-wrap justify-center gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => useDemo(d)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 dark:bg-[#0d0d0d]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm">
            <Wallet size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
          {children}
        </div>
        {footer && <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>}
      </div>
    </div>
  );
}
