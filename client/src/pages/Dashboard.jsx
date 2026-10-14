import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { apiErrorMessage } from '../lib/api.js';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { ProgressRing } from '../components/ui/ProgressBar.jsx';
import { SkeletonCards } from '../components/ui/Skeleton.jsx';
import TaskForm from '../components/tasks/TaskForm.jsx';
import TaskItem from '../components/tasks/TaskItem.jsx';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Done' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  // One pass fetches everything the dashboard shows; filtering happens client side.
  const load = useCallback(async () => {
    setError('');
    try {
      const [taskRes, statsRes, docRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/tasks/stats'),
        api.get('/documents'),
      ]);
      setTasks(taskRes.data.tasks);
      setStats(statsRes.data.stats);
      setDocuments(docRes.data.documents);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleTasks = useMemo(() => {
    if (filter === 'pending') return tasks.filter((t) => !t.completed);
    if (filter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const focusTasks = useMemo(() => {
    const today = startOfToday();
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    return tasks
      .filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < endOfToday)
      .slice(0, 4);
  }, [tasks]);

  async function saveTask(values) {
    setSaving(true);
    setError('');
    try {
      if (editing) await api.put(`/tasks/${editing._id}`, values);
      else await api.post('/tasks', values);
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function runOnTask(task, action) {
    setBusyId(task._id);
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId('');
    }
  }

  const toggleTask = (task) => runOnTask(task, () => api.patch(`/tasks/${task._id}/toggle`));

  const deleteTask = (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    runOnTask(task, () => api.delete(`/tasks/${task._id}`));
  };

  function startCreate() {
    setEditing(null);
    setShowForm(true);
  }

  const firstName = user.name.split(' ')[0];
  const recentDocs = documents.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {loading
              ? 'Loading your workspace...'
              : stats?.overdue
                ? `${stats.overdue} task${stats.overdue === 1 ? '' : 's'} overdue — worth clearing first.`
                : stats?.dueToday
                  ? `${stats.dueToday} task${stats.dueToday === 1 ? '' : 's'} due today. You've got this.`
                  : stats?.pending
                    ? `${stats.pending} task${stats.pending === 1 ? '' : 's'} waiting, nothing due today.`
                    : 'Everything is clear. Add a task or upload a PDF to get going.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/documents">
            <Button variant="secondary">Upload PDF</Button>
          </Link>
          <Button onClick={startCreate}>New task</Button>
        </div>
      </div>

      <Alert type="error" onDismiss={() => setError('')}>
        {error}
      </Alert>

      {/* Progress + stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-5 lg:col-span-1">
          <ProgressRing value={stats?.completionRate ?? 0}>
            <div>
              <p className="text-xl font-semibold text-slate-900">{stats?.completionRate ?? 0}%</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">done</p>
            </div>
          </ProgressRing>
          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight text-slate-900">Study progress</h2>
            <p className="mt-1 text-sm text-slate-600">
              {stats ? `${stats.completed} of ${stats.total} tasks completed` : '—'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {documents.length} PDF{documents.length === 1 ? '' : 's'} in your workspace
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard label="Pending" value={stats?.pending ?? '—'} icon="◔" tone="indigo" />
          <StatCard label="Due today" value={stats?.dueToday ?? '—'} icon="◷" tone="amber" />
          <StatCard label="Overdue" value={stats?.overdue ?? '—'} icon="!" tone="rose" />
          <StatCard
            label="Completed"
            value={stats?.completed ?? '—'}
            hint={stats?.total ? `of ${stats.total} total` : ''}
            icon="✓"
            tone="emerald"
          />
        </div>
      </div>

      {/* Focus + continue learning */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader
            title="Today's focus"
            subtitle="Due today or already overdue"
            className="border-b border-slate-100 p-5 pb-4"
          />
          {loading ? (
            <div className="p-5">
              <SkeletonCards count={2} />
            </div>
          ) : focusTasks.length === 0 ? (
            <EmptyState
              icon="🎯"
              title="Nothing due right now"
              text="Add a due date to a task and it will show up here."
            />
          ) : (
            <ul>
              {focusTasks.map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  busy={busyId === task._id}
                  onToggle={toggleTask}
                  onEdit={(t) => {
                    setEditing(t);
                    setShowForm(true);
                  }}
                  onDelete={deleteTask}
                  compact
                />
              ))}
            </ul>
          )}
        </Card>

        <Card padding="none">
          <CardHeader
            title="Continue learning"
            subtitle="Pick up where you left off"
            action={
              documents.length > 0 && (
                <Link to="/documents">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              )
            }
            className="border-b border-slate-100 p-5 pb-4"
          />
          {loading ? (
            <div className="p-5">
              <SkeletonCards count={2} />
            </div>
          ) : recentDocs.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No PDFs yet"
              text="Upload a lecture PDF and StudyMind will build notes, flashcards and a quiz from it."
              action={
                <Link to="/documents">
                  <Button size="sm">Upload your first PDF</Button>
                </Link>
              }
            />
          ) : (
            <ul>
              {recentDocs.map((doc) => (
                <li
                  key={doc._id}
                  className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3.5 transition-colors last:border-0 hover:bg-slate-50/70"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-[10px] font-bold text-rose-600">
                    PDF
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/documents/${doc._id}`}
                      className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-700"
                    >
                      {doc.originalName}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {doc.hasNotes && <Badge tone="emerald">Notes</Badge>}
                      {doc.hasFlashcards && <Badge tone="emerald">Cards</Badge>}
                      {doc.hasQuiz && <Badge tone="emerald">Quiz</Badge>}
                      {!doc.hasNotes && !doc.hasFlashcards && !doc.hasQuiz && (
                        <Badge tone="slate">Nothing generated yet</Badge>
                      )}
                    </div>
                  </div>
                  <Link to={`/documents/${doc._id}?tab=${doc.hasNotes ? 'quiz' : 'notes'}`}>
                    <Button size="sm" variant="subtle">
                      {doc.hasNotes ? 'Take quiz' : 'Make notes'}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Task form */}
      {showForm && (
        <TaskForm
          task={editing}
          saving={saving}
          onSave={saveTask}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {/* All tasks */}
      <Card padding="none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 pb-4">
          <div>
            <h2 className="font-semibold tracking-tight text-slate-900">Study tasks</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {tasks.length} task{tasks.length === 1 ? '' : 's'} in total
            </p>
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  filter === f.key
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-5">
            <SkeletonCards count={3} />
          </div>
        ) : visibleTasks.length === 0 ? (
          <EmptyState
            icon={filter === 'completed' ? '🏁' : '📝'}
            title={filter === 'completed' ? 'Nothing completed yet' : 'No tasks here'}
            text={
              filter === 'completed'
                ? 'Finish a task and it will appear here.'
                : 'Break your revision into small tasks and tick them off.'
            }
            action={
              filter !== 'completed' && !showForm ? (
                <Button size="sm" onClick={startCreate}>
                  Add a task
                </Button>
              ) : null
            }
          />
        ) : (
          <ul>
            {visibleTasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                busy={busyId === task._id}
                onToggle={toggleTask}
                onEdit={(t) => {
                  setEditing(t);
                  setShowForm(true);
                }}
                onDelete={deleteTask}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
