import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User,
  BookOpen,
  CheckCircle2,
  Lock,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import api, { apiErrorMessage } from '../lib/api.js';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [details, setDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    institution: user?.institution || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [stats, setStats] = useState({
    documents: 0,
    pages: 0,
    completedTasks: 0,
    materials: 0,
  });

  const [status, setStatus] = useState({ error: '', success: '' });
  const [saving, setSaving] = useState('');

  // Sync state if user changes in context
  useEffect(() => {
    if (user) {
      setDetails({
        name: user.name || '',
        email: user.email || '',
        institution: user.institution || '',
      });
    }
  }, [user]);

  // Load authentic library and task stats for usage overview
  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/documents'),
      api.get('/tasks/stats'),
    ])
      .then(([docRes, statsRes]) => {
        if (!mounted) return;
        const docs = docRes.data.documents || [];
        const taskStats = statsRes.data.stats || {};
        const pages = docs.reduce((acc, d) => acc + (d.pageCount || 0), 0);
        const materials = docs.reduce(
          (acc, d) =>
            acc + (d.hasNotes ? 1 : 0) + (d.hasFlashcards ? 1 : 0) + (d.hasQuiz ? 1 : 0),
          0
        );

        setStats({
          documents: docs.length,
          pages,
          completedTasks: taskStats.completed || 0,
          materials,
        });
      })
      .catch(() => {
        // Stats are optional enhancement on profile view
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function saveDetails(e) {
    e.preventDefault();
    setStatus({ error: '', success: '' });
    setSaving('details');
    try {
      await updateProfile(details);
      toast.success('Account details updated');
      setStatus({ error: '', success: 'Account details saved successfully.' });
    } catch (err) {
      const msg = apiErrorMessage(err);
      setStatus({ error: msg, success: '' });
      toast.error(msg);
    } finally {
      setSaving('');
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setStatus({ error: '', success: '' });

    if (passwords.newPassword.length < 8) {
      const msg = 'New password must be at least 8 characters';
      setStatus({ error: msg, success: '' });
      return toast.error(msg);
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      const msg = 'New passwords do not match';
      setStatus({ error: msg, success: '' });
      return toast.error(msg);
    }

    setSaving('password');
    try {
      await updateProfile({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
      setStatus({ error: '', success: 'Password changed successfully.' });
    } catch (err) {
      const msg = apiErrorMessage(err);
      setStatus({ error: msg, success: '' });
      toast.error(msg);
    } finally {
      setSaving('');
    }
  }

  function handleLogout() {
    logout();
    toast.info('Signed out of FileSense');
    navigate('/', { replace: true });
  }

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'FS';

  return (
    <div className="space-y-6">
      {/* Header & Account Identity */}
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-13 w-13 shrink-0 place-items-center rounded-lg border border-border-subtle bg-subtle font-mono text-base font-semibold text-primary">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {user?.name || 'Student Profile'}
            </h1>
            <p className="mt-0.5 text-xs text-secondary font-mono">
              {user?.email}
              {user?.institution ? ` • ${user.institution}` : ''} • Member since {joined}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="self-start gap-1.5 text-danger hover:bg-danger-subtle sm:self-auto"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Sign out</span>
        </Button>
      </div>

      {status.error && (
        <Alert type="danger" onDismiss={() => setStatus({ ...status, error: '' })}>
          {status.error}
        </Alert>
      )}
      {status.success && (
        <Alert type="success" onDismiss={() => setStatus({ ...status, success: '' })}>
          {status.success}
        </Alert>
      )}

      {/* Usage & Learning Activity Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Library Documents"
          value={stats.documents}
          hint={stats.documents > 0 ? `${stats.pages} extracted pages` : 'No documents'}
          icon={<BookOpen className="h-4 w-4 stroke-[2]" aria-hidden="true" />}
          tone="slate"
        />
        <StatCard
          label="Completed Tasks"
          value={stats.completedTasks}
          hint="Revision milestones"
          icon={<CheckCircle2 className="h-4 w-4 stroke-[2]" aria-hidden="true" />}
          tone="emerald"
        />
        <StatCard
          label="Generated Materials"
          value={stats.materials}
          hint="Notes, cards & quizzes"
          icon={<Layers className="h-4 w-4 stroke-[2]" aria-hidden="true" />}
          tone="amber"
        />
        <StatCard
          label="Account Status"
          value="Active"
          hint="Verified student session"
          icon={<User className="h-4 w-4 stroke-[2]" aria-hidden="true" />}
          tone="indigo"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* User Details Form */}
        <Card className="border border-border-subtle bg-surface shadow-xs">
          <CardHeader
            title="Account Details"
            subtitle="Personalize your identity and academic institution"
          />
          <form onSubmit={saveDetails} className="mt-4 space-y-4">
            <Input
              id="name"
              name="name"
              label="Full name"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              autoComplete="name"
              required
            />
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
              autoComplete="email"
              required
            />
            <Input
              id="institution"
              name="institution"
              label="University or institution"
              placeholder="e.g. Stanford University"
              value={details.institution}
              onChange={(e) => setDetails({ ...details, institution: e.target.value })}
              autoComplete="organization"
            />
            <div className="pt-1">
              <Button type="submit" loading={saving === 'details'} variant="primary">
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Preferences & Appearance Card */}
        <div className="space-y-6">
          <Card className="border border-border-subtle bg-surface shadow-xs">
            <CardHeader
              title="Appearance & Theme"
              subtitle="Choose how FileSense renders on your device"
            />
            <div className="mt-4 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border-subtle bg-subtle/50 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-primary">Theme Preference</p>
                  <p className="text-xs text-secondary mt-0.5">
                    Currently resolved to <span className="font-mono font-medium text-accent">{resolvedTheme}</span> mode
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <ThemeToggle />
                </div>
              </div>

              {/* Explicit Mode Switcher */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'border-accent bg-accent-subtle text-accent'
                      : 'border-border-subtle bg-surface text-secondary hover:text-primary hover:bg-subtle'
                  }`}
                >
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'border-accent bg-accent-subtle text-accent'
                      : 'border-border-subtle bg-surface text-secondary hover:text-primary hover:bg-subtle'
                  }`}
                >
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    theme === 'system'
                      ? 'border-accent bg-accent-subtle text-accent'
                      : 'border-border-subtle bg-surface text-secondary hover:text-primary hover:bg-subtle'
                  }`}
                >
                  <Laptop className="h-4 w-4" aria-hidden="true" />
                  <span>System</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Password & Security Card */}
          <Card className="border border-border-subtle bg-surface shadow-xs">
            <CardHeader
              title="Password & Security"
              subtitle="Update your password to keep your account secure"
            />
            <form onSubmit={savePassword} className="mt-4 space-y-4">
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                label="Current password"
                placeholder="••••••••"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, currentPassword: e.target.value })
                }
                autoComplete="current-password"
                showPasswordToggle
                required
              />
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                label="New password"
                placeholder="At least 8 characters"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                autoComplete="new-password"
                showPasswordToggle
                hint="Use at least 8 characters"
                required
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm new password"
                placeholder="Repeat new password"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirmPassword: e.target.value })
                }
                autoComplete="new-password"
                showPasswordToggle
                error={
                  passwords.confirmPassword &&
                  passwords.newPassword !== passwords.confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
                required
              />
              <div className="pt-1">
                <Button
                  type="submit"
                  variant="secondary"
                  loading={saving === 'password'}
                  className="gap-1.5"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>Update password</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
