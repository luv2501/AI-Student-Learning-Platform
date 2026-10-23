import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ListTodo,
  Plus,
  UploadCloud,
  ArrowRight,
  FileText,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { apiErrorMessage } from '../lib/api.js';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SegmentedTabs from '../components/ui/SegmentedTabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import MotionTransition from '../components/ui/MotionTransition.jsx';
import { SkeletonTaskList, SkeletonDocList } from '../components/ui/Skeleton.jsx';
import TaskForm from '../components/tasks/TaskForm.jsx';
import TaskItem from '../components/tasks/TaskItem.jsx';
import DueReviewModal from '../components/flashcards/DueReviewModal.jsx';

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

function isDueToday(task) {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const today = startOfToday();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return due >= today && due < tomorrow;
}

function isUrgent(task) {
  if (task.completed) return false;
  if (task.priority === 'high') return true;
  if (task.dueDate && new Date(task.dueDate) < startOfToday()) return true;
  return false;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);
  const [showDueModal, setShowDueModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [taskToDelete, setTaskToDelete] = useState(null);


  const load = useCallback(async () => {
    setError('');
    try {
      const [taskRes, statsRes, docRes, dueRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/tasks/stats'),
        api.get('/documents'),
        api.get('/flashcards/due-count').catch(() => ({ data: { dueCount: 0 } })),
      ]);
      setTasks(taskRes.data.tasks);
      setStats(statsRes.data.stats);
      setDocuments(docRes.data.documents);
      setDueFlashcardsCount(dueRes.data?.dueCount ?? 0);
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

  const todayTasksCount = useMemo(
    () => tasks.filter((t) => !t.completed && isDueToday(t)).length,
    [tasks]
  );

  const urgentTasksCount = useMemo(
    () => tasks.filter(isUrgent).length,
    [tasks]
  );

  const visibleTasks = useMemo(() => {
    if (filter === 'today') return tasks.filter((t) => isDueToday(t));
    if (filter === 'urgent') return tasks.filter(isUrgent);
    if (filter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const tabItems = useMemo(
    () => [
      { key: 'all', label: 'All', badge: tasks.length },
      { key: 'today', label: 'Today', badge: todayTasksCount },
      { key: 'urgent', label: 'Urgent', badge: urgentTasksCount },
      { key: 'completed', label: 'Completed', badge: stats?.completed ?? 0 },
    ],
    [tasks.length, todayTasksCount, urgentTasksCount, stats?.completed]
  );

  const totalPages = useMemo(
    () => documents.reduce((sum, d) => sum + (d.pageCount || 0), 0),
    [documents]
  );

  const materialsCount = useMemo(
    () =>
      documents.reduce(
        (sum, d) => sum + (d.hasNotes ? 1 : 0) + (d.hasFlashcards ? 1 : 0) + (d.hasQuiz ? 1 : 0),
        0
      ),
    [documents]
  );

  const recentDocs = useMemo(() => documents.slice(0, 4), [documents]);

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
    setTaskToDelete(task);
  };

  function startCreate() {
    setEditing(null);
    setShowForm(true);
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Cockpit Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border-subtle pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
            <span>{todayFormatted}</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {loading
              ? 'Loading your FileSense workspace...'
              : stats?.overdue
                ? `${stats.overdue} task${stats.overdue === 1 ? '' : 's'} overdue. Recommended to resolve first.`
                : stats?.dueToday
                  ? `${stats.dueToday} task${stats.dueToday === 1 ? '' : 's'} scheduled for today.`
                  : stats?.pending
                    ? `${stats.pending} pending task${stats.pending === 1 ? '' : 's'} in your queue.`
                    : 'All study tasks complete. Ready for new readings.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {dueFlashcardsCount > 0 && (
            <Button
              onClick={() => setShowDueModal(true)}
              variant="secondary"
              size="sm"
              className="gap-1.5"
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>Review Due</span>
              <span className="rounded-sm bg-danger-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold text-danger border border-danger/30">
                {dueFlashcardsCount}
              </span>
            </Button>
          )}
          <Link to="/documents">
            <Button variant="primary" size="sm" className="gap-1.5">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              <span>Upload Document</span>
            </Button>
          </Link>
          <Button onClick={startCreate} variant="secondary" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="danger" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Spaced Repetition Due Action Banner */}
      {dueFlashcardsCount > 0 && (
        <Card className="border-accent/30 bg-accent-subtle/15 p-4 transition-all">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent-subtle text-accent">
                <Layers className="h-4.5 w-4.5 stroke-[2]" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-primary">
                    Flashcards Due for Review
                  </h2>
                  <Badge tone="rose" className="font-mono text-[11px]">
                    {dueFlashcardsCount} due today
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-secondary leading-relaxed">
                  You have concepts scheduled for active recall practice based on the SM-2 algorithm.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowDueModal(true)}
                className="gap-1.5 shadow-xs"
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Start review session</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Authentic Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Library Documents"
          value={documents.length}
          hint={documents.length > 0 ? `${totalPages} total pages` : 'No PDFs uploaded'}
          icon={<BookOpen className="h-4 w-4 stroke-[2]" aria-hidden="true" />}
          tone="slate"
        />
        <StatCard
          label="Pending Tasks"
          value={stats?.pending ?? 0}
          hint={stats?.dueToday ? `${stats.dueToday} due today` : 'No tasks due today'}
          icon={<Clock className="h-4 w-4 stroke-[2]" aria-hidden="true" />}
          tone="indigo"
        />
        <StatCard
          label="Completed Tasks"
          value={stats?.completed ?? 0}
          hint={stats?.total ? `${stats.completionRate}% completion rate` : 'No tasks recorded'}
          icon={<CheckCircle2 className="h-4 w-4 stroke-[2]" aria-hidden="true" />}
          tone="emerald"
        />
        <StatCard
          label="Generated Materials"
          value={materialsCount}
          hint={documents.length > 0 ? 'Notes, cards, and quizzes' : 'Upload PDF to generate'}
          icon={<Layers className="h-4 w-4 stroke-[2]" aria-hidden="true" />}
          tone="amber"
        />
      </div>

      {/* Inline Task Form */}
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

      {/* Quick Launch & Task Management Section */}
      <div className="space-y-6">
        {/* Recent Documents Quick Launch */}
        <Card padding="none">
          <CardHeader
            title="Recent Documents"
            subtitle="Quick launch into your study materials"
            action={
              documents.length > 0 && (
                <Link to="/documents">
                  <Button variant="ghost" size="xs" className="gap-1 text-xs text-secondary hover:text-primary">
                    <span>View library</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </Link>
              )
            }
            className="border-b border-border-subtle p-4 pb-3"
          />

          {loading ? (
            <div className="p-4">
              <SkeletonDocList count={3} />
            </div>
          ) : recentDocs.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6 text-muted" aria-hidden="true" />}
              title="No documents in your library"
              text="Upload a course PDF to generate structured notes, active recall flashcards, and diagnostic quizzes."
              action={
                <Link to="/documents">
                  <Button size="sm" variant="primary" className="gap-1.5">
                    <UploadCloud className="h-4 w-4" aria-hidden="true" />
                    Upload your first PDF
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {recentDocs.map((doc) => (
                <li
                  key={doc._id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-subtle/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border-subtle bg-subtle text-accent">
                      <FileText className="h-4.5 w-4.5 stroke-[2]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/documents/${doc._id}`}
                          className="truncate text-sm font-medium text-primary hover:text-accent hover:underline"
                        >
                          {doc.title || doc.originalName}
                        </Link>
                        <span className="shrink-0 rounded-xs border border-border-subtle bg-subtle px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted">
                          PDF
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono text-[11px] text-muted">
                          {doc.pageCount || 1} {doc.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                        <span className="text-muted">•</span>
                        <div className="flex flex-wrap items-center gap-1">
                          {doc.hasNotes && <Badge tone="emerald">Notes</Badge>}
                          {doc.hasFlashcards && <Badge tone="emerald">Cards</Badge>}
                          {doc.hasQuiz && <Badge tone="emerald">Quiz</Badge>}
                          {!doc.hasNotes && !doc.hasFlashcards && !doc.hasQuiz && (
                            <Badge tone="slate">Ready for AI</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                    <Link to={`/documents/${doc._id}?tab=notes`}>
                      <Button
                        variant={doc.hasNotes ? 'secondary' : 'ghost'}
                        size="xs"
                        className="text-xs"
                      >
                        Notes
                      </Button>
                    </Link>
                    <Link to={`/documents/${doc._id}?tab=flashcards`}>
                      <Button
                        variant={doc.hasFlashcards ? 'secondary' : 'ghost'}
                        size="xs"
                        className="text-xs"
                      >
                        Cards
                      </Button>
                    </Link>
                    <Link to={`/documents/${doc._id}?tab=quiz`}>
                      <Button
                        variant={doc.hasQuiz ? 'secondary' : 'ghost'}
                        size="xs"
                        className="text-xs"
                      >
                        Quiz
                      </Button>
                    </Link>
                    <Link to={`/documents/${doc._id}`}>
                      <Button
                        variant="subtle"
                        size="xs"
                        className="gap-1 font-medium"
                      >
                        <span>Study</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Study Tasks & Schedule Card */}
        <Card padding="none">
          <div className="flex flex-col gap-3 border-b border-border-subtle p-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-primary">Study Tasks</h2>
              <p className="mt-0.5 text-xs text-secondary">
                Prioritize assignments and track syllabus coverage
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <SegmentedTabs
                items={tabItems}
                value={filter}
                onChange={setFilter}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-4">
              <SkeletonTaskList count={3} />
            </div>
          ) : (
            <MotionTransition key={filter}>
              {visibleTasks.length === 0 ? (
                <EmptyState
                  icon={
                    filter === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-muted" aria-hidden="true" />
                    ) : filter === 'urgent' ? (
                      <AlertCircle className="h-6 w-6 text-muted" aria-hidden="true" />
                    ) : (
                      <ListTodo className="h-6 w-6 text-muted" aria-hidden="true" />
                    )
                  }
                  title={
                    filter === 'completed'
                      ? 'No completed tasks yet'
                      : filter === 'urgent'
                        ? 'No urgent tasks'
                        : filter === 'today'
                          ? 'No tasks scheduled for today'
                          : 'No study tasks found'
                  }
                  text={
                    filter === 'completed'
                      ? 'Check off completed items from your study queue.'
                      : filter === 'urgent'
                        ? 'Great job. You have zero overdue or high-priority tasks pending.'
                        : filter === 'today'
                          ? 'Nothing due today. Pick from your queue or add a new task.'
                          : 'Create revision tasks to keep your exam preparation on track.'
                  }
                  action={
                    filter !== 'completed' && !showForm ? (
                      <Button size="sm" variant="secondary" onClick={startCreate} className="gap-1.5">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add study task
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
            </MotionTransition>
          )}
        </Card>
      </div>

      {/* Delete Task Confirmation Modal */}
      <Modal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
      >
        {taskToDelete && (
          <>
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-danger/30 bg-danger-subtle text-danger">
                <AlertTriangle className="h-5 w-5 stroke-[2]" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  id="modal-dialog-title"
                  className="text-base font-semibold tracking-tight text-primary"
                >
                  Delete Task
                </h3>
                <p
                  id="modal-dialog-description"
                  className="mt-1 text-xs text-secondary leading-relaxed"
                >
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-primary">
                    &quot;{taskToDelete.title}&quot;
                  </span>
                  ? This task will be permanently removed.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTaskToDelete(null)}
                disabled={busyId === taskToDelete._id}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={busyId === taskToDelete._id}
                onClick={async () => {
                  const toDelete = taskToDelete;
                  setTaskToDelete(null);
                  await runOnTask(
                    toDelete,
                    () => api.delete(`/tasks/${toDelete._id}`),
                    'Task deleted'
                  );
                }}
              >
                Delete Task
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Due Flashcards Review Modal */}
      <DueReviewModal
        isOpen={showDueModal}
        onClose={() => setShowDueModal(false)}
        onSessionFinished={load}
      />
    </div>
  );
}
