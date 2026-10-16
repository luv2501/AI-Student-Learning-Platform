import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Target,
  BookOpen,
  ListTodo,
  Plus,
  UploadCloud,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { apiErrorMessage } from '../lib/api.js';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { ProgressRing } from '../components/ui/ProgressBar.jsx';
import { SkeletonTaskList, SkeletonDocList } from '../components/ui/Skeleton.jsx';
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
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
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
      if (editing) {
        await api.put(`/tasks/${editing._id}`, values);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', values);
        toast.success('Task created');
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function runOnTask(task, action, successMessage) {
    setBusyId(task._id);
    setError('');
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      await load();
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId('');
    }
  }

  const toggleTask = (task) =>
    runOnTask(
      task,
      () => api.patch(`/tasks/${task._id}/toggle`),
      task.completed ? 'Task marked as pending' : 'Task completed'
    );

  const deleteTask = (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    runOnTask(task, () => api.delete(`/tasks/${task._id}`), 'Task deleted');
  };

  function startCreate() {
    setEditing(null);
    setShowForm(true);
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const recentDocs = documents.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {loading
              ? 'Loading your FileSense workspace...'
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
            <Button variant="secondary" size="sm" className="gap-1.5">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload PDF
            </Button>
          </Link>
          <Button onClick={startCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New task
          </Button>
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
              <p className="font-mono text-xl font-semibold text-primary">{stats?.completionRate ?? 0}%</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted">done</p>
            </div>
          </ProgressRing>
          <div className="min-w-0">
            <h2 className="font-medium tracking-tight text-primary text-sm sm:text-base">Study progress</h2>
            <p className="mt-1 text-xs text-secondary font-mono">
              {stats ? `${stats.completed} of ${stats.total} tasks completed` : '—'}
            </p>
            <p className="mt-2 text-xs text-muted">
              {documents.length} PDF{documents.length === 1 ? '' : 's'} in your workspace
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard
            label="Pending"
            value={stats?.pending ?? '—'}
            icon={<Clock className="h-4 w-4" aria-hidden="true" />}
            tone="indigo"
          />
          <StatCard
            label="Due today"
            value={stats?.dueToday ?? '—'}
            icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
            tone="amber"
          />
          <StatCard
            label="Overdue"
            value={stats?.overdue ?? '—'}
            icon={<AlertCircle className="h-4 w-4" aria-hidden="true" />}
            tone="rose"
          />
          <StatCard
            label="Completed"
            value={stats?.completed ?? '—'}
            hint={stats?.total ? `of ${stats.total} total` : ''}
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
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
            className="border-b border-border-subtle p-4 pb-3"
          />
          {loading ? (
            <div className="p-4">
              <SkeletonTaskList count={2} />
            </div>
          ) : focusTasks.length === 0 ? (
            <EmptyState
              icon={<Target className="h-6 w-6 text-muted" aria-hidden="true" />}
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
                  <Button variant="ghost" size="xs">
                    View all
                  </Button>
                </Link>
              )
            }
            className="border-b border-border-subtle p-4 pb-3"
          />
          {loading ? (
            <div className="p-4">
              <SkeletonDocList count={2} />
            </div>
          ) : recentDocs.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6 text-muted" aria-hidden="true" />}
              title="No PDFs yet"
              text="Upload a lecture PDF and FileSense will build notes, flashcards and a quiz from it."
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
                  className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3.5 transition-colors last:border-0 hover:bg-subtle/50"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border-subtle bg-subtle text-accent">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/documents/${doc._id}`}
                      className="block truncate text-sm font-medium text-primary hover:text-accent"
                    >
                      {doc.title || doc.originalName}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {doc.hasNotes && <Badge tone="emerald">Notes</Badge>}
                      {doc.hasFlashcards && <Badge tone="emerald">Cards</Badge>}
                      {doc.hasQuiz && <Badge tone="emerald">Quiz</Badge>}
                      {!doc.hasNotes && !doc.hasFlashcards && !doc.hasQuiz && (
                        <Badge tone="slate">Not generated yet</Badge>
                      )}
                    </div>
                  </div>
                  <Link to={`/documents/${doc._id}?tab=${doc.hasNotes ? 'quiz' : 'notes'}`}>
                    <Button size="xs" variant="subtle" className="gap-1">
                      {doc.hasNotes ? 'Take quiz' : 'Make notes'}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-4 pb-3">
          <div>
            <h2 className="font-medium tracking-tight text-primary text-sm sm:text-base">Study tasks</h2>
            <p className="mt-0.5 text-xs text-muted font-mono">
              {tasks.length} task{tasks.length === 1 ? '' : 's'} in total
            </p>
          </div>
          <div className="flex gap-1 rounded-md border border-border-subtle bg-subtle p-0.5">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-muted hover:text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <SkeletonTaskList count={3} />
          </div>
        ) : visibleTasks.length === 0 ? (
          <EmptyState
            icon={
              filter === 'completed' ? (
                <CheckCircle2 className="h-6 w-6 text-muted" aria-hidden="true" />
              ) : (
                <ListTodo className="h-6 w-6 text-muted" aria-hidden="true" />
              )
            }
            title={filter === 'completed' ? 'Nothing completed yet' : 'No tasks here'}
            text={
              filter === 'completed'
                ? 'Finish a task and it will appear here.'
                : 'Break your revision into small tasks and tick them off.'
            }
            action={
              filter !== 'completed' && !showForm ? (
                <Button size="sm" onClick={startCreate} className="gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden="true" />
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
