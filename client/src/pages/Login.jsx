import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage } from '../lib/api.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isExpired =
    searchParams.get('expired') === 'true' ||
    Boolean(location.state?.expired);
  const initialExpiredMessage =
    location.state?.message ||
    (isExpired ? 'Your session expired, please log in again' : '');

  const [expiredNotice, setExpiredNotice] = useState(initialExpiredMessage);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setExpiredNotice('');
    setSaving(true);
    try {
      await login(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up your study plan."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        {expiredNotice && (
          <Alert type="warning" onDismiss={() => setExpiredNotice('')}>
            {expiredNotice}
          </Alert>
        )}
        <Alert onDismiss={() => setError('')}>{error}</Alert>

        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={form.email}
          onChange={change}
          autoComplete="email"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          value={form.password}
          onChange={change}
          autoComplete="current-password"
          required
        />

        <Button type="submit" fullWidth disabled={saving}>
          {saving && <Spinner />}
          {saving ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
