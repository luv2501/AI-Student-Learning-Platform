import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage } from '../lib/api.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    institution: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setSaving(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        institution: form.institution,
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free, and takes about 20 seconds."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Alert onDismiss={() => setError('')}>{error}</Alert>

        <Input
          id="name"
          name="name"
          label="Full name"
          placeholder="Alex Kumar"
          value={form.name}
          onChange={change}
          autoComplete="name"
          required
        />
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
          id="institution"
          name="institution"
          label="School or college"
          placeholder="Optional"
          value={form.institution}
          onChange={change}
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={change}
          autoComplete="new-password"
          hint={form.password && form.password.length < 6 ? 'A bit longer, please' : ''}
          required
        />
        <Input
          id="confirm"
          name="confirm"
          type="password"
          label="Confirm password"
          placeholder="Repeat your password"
          value={form.confirm}
          onChange={change}
          autoComplete="new-password"
          error={mismatch ? 'Passwords do not match' : ''}
          required
        />

        <Button type="submit" fullWidth disabled={saving}>
          {saving && <Spinner />}
          {saving ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
