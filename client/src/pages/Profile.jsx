import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage } from '../lib/api.js';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [details, setDetails] = useState({
    name: user.name,
    email: user.email,
    institution: user.institution || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [status, setStatus] = useState({ error: '', success: '' });
  const [saving, setSaving] = useState('');

  async function saveDetails(e) {
    e.preventDefault();
    setStatus({ error: '', success: '' });
    setSaving('details');
    try {
      await updateProfile(details);
      setStatus({ error: '', success: 'Profile updated' });
    } catch (err) {
      setStatus({ error: apiErrorMessage(err), success: '' });
    } finally {
      setSaving('');
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setStatus({ error: '', success: '' });

    if (passwords.newPassword.length < 6) {
      return setStatus({ error: 'New password must be at least 6 characters', success: '' });
    }

    setSaving('password');
    try {
      await updateProfile(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setStatus({ error: '', success: 'Password changed' });
    } catch (err) {
      setStatus({ error: apiErrorMessage(err), success: '' });
    } finally {
      setSaving('');
    }
  }

  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-semibold text-white shadow-sm shadow-indigo-600/30">
          {initials}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
            {user.name}
          </h1>
          <p className="text-sm text-slate-500">
            {user.email}
            {user.institution ? ` · ${user.institution}` : ''} · joined {joined}
          </p>
        </div>
      </div>

      <Alert type="error" onDismiss={() => setStatus({ ...status, error: '' })}>
        {status.error}
      </Alert>
      <Alert type="success" onDismiss={() => setStatus({ ...status, success: '' })}>
        {status.success}
      </Alert>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader title="Your details" subtitle="Used across your workspace" />
          <form onSubmit={saveDetails} className="mt-4 space-y-4">
            <Input
              id="p-name"
              label="Full name"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              required
            />
            <Input
              id="p-email"
              type="email"
              label="Email"
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
              required
            />
            <Input
              id="p-institution"
              label="School or college"
              placeholder="Optional"
              value={details.institution}
              onChange={(e) => setDetails({ ...details, institution: e.target.value })}
            />
            <Button type="submit" disabled={saving === 'details'}>
              {saving === 'details' && <Spinner />}
              Save changes
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Change password" subtitle="At least 6 characters" />
          <form onSubmit={savePassword} className="mt-4 space-y-4">
            <Input
              id="p-current"
              type="password"
              label="Current password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              autoComplete="current-password"
              required
            />
            <Input
              id="p-new"
              type="password"
              label="New password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              autoComplete="new-password"
              required
            />
            <Button type="submit" variant="secondary" disabled={saving === 'password'}>
              {saving === 'password' && <Spinner />}
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
