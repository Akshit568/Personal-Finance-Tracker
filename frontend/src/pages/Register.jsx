import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Field, Input, Select } from '../components/ui';
import { AuthShell } from './Login';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created — welcome!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.apiMessage || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Start tracking your income and expenses."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          <Input required value={form.name} onChange={set('name')} placeholder="Jane Doe" />
        </Field>
        <Field label="Email" required>
          <Input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </Field>
        <Field label="Password" required hint="At least 6 characters.">
          <Input type="password" required value={form.password} onChange={set('password')} placeholder="••••••••" />
        </Field>
        <Field label="Account type">
          <Select value={form.role} onChange={set('role')}>
            <option value="user">User — manage your own transactions</option>
            <option value="read-only">Read-only — view access only</option>
          </Select>
        </Field>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          <UserPlus size={18} /> Create account
        </Button>
      </form>
    </AuthShell>
  );
}
