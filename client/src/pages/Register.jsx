import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage } from '../lib/api.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';

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
  const passwordTooShort = form.password.length > 0 && form.password.length < 8;

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }
    if (form.password !== form.confirm) {
      return setError('Passwords do not match');
    }

    setSaving(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        institution: form.institution.trim(),
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
      subtitle="Start turning course materials into structured study sets."
      footer={
        <p className="text-xs text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && (
          <Alert type="danger" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

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
          label="Email address"
          placeholder="student@university.edu"
          value={form.email}
          onChange={change}
          autoComplete="email"
          required
        />
        <Input
          id="institution"
          name="institution"
          label="University or institution"
          placeholder="Optional"
          value={form.institution}
          onChange={change}
          autoComplete="organization"
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={change}
          autoComplete="new-password"
          showPasswordToggle
          hint={!passwordTooShort ? 'Use at least 8 characters' : ''}
          error={passwordTooShort ? 'Must be at least 8 characters' : ''}
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
          showPasswordToggle
          error={mismatch ? 'Passwords do not match' : ''}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={saving}
          >
            {saving ? 'Creating account...' : 'Create account'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
