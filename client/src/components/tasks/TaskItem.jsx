import { Check } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import { DEFAULT_TASK_SUBJECT } from '../../lib/constants.js';

const priorityTone = { low: 'slate', medium: 'amber', high: 'rose' };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** "Overdue · 12 Aug" / "Due today" / "Due 30 Aug" */
function dueLabel(dueDate) {
  const due = new Date(dueDate);
  const today = startOfToday();
  const day = 24 * 60 * 60 * 1000;
  const text = due.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  if (due < today) return { text: `Overdue · ${text}`, tone: 'text-danger' };
  if (due < new Date(today.getTime() + day)) return { text: 'Due today', tone: 'text-warning' };
  if (due < new Date(today.getTime() + 2 * day)) return { text: 'Due tomorrow', tone: 'text-muted' };
  return { text: `Due ${text}`, tone: 'text-muted' };
}

export default function TaskItem({ task, onToggle, onEdit, onDelete, busy, compact = false }) {
  const due = task.dueDate && !task.completed ? dueLabel(task.dueDate) : null;

  return (
    <li className="group flex items-start gap-3 border-b border-border-subtle px-4 py-3 transition-colors last:border-0 hover:bg-subtle/50 sm:px-5">
      <button
        type="button"
        onClick={() => onToggle(task)}
        disabled={busy}
        aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
        className={`mt-0.5 grid h-4.5 w-4.5 shrink-0 cursor-pointer place-items-center rounded-sm border transition-colors ${
          task.completed
            ? 'border-success bg-success text-white'
            : 'border-border-subtle bg-surface hover:border-accent hover:bg-accent-subtle/50'
        }`}
      >
        {busy ? (
          <Spinner className="h-2.5 w-2.5 text-muted" />
        ) : task.completed ? (
          <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
        ) : null}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-xs font-medium transition-colors sm:text-sm ${
            task.completed ? 'text-muted line-through' : 'text-primary'
          }`}
        >
          {task.title}
        </p>

        {!compact && task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-secondary leading-relaxed">{task.description}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <Badge tone="indigo">{task.subject || DEFAULT_TASK_SUBJECT}</Badge>
          <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          {due && <span className={`font-mono text-[11px] font-medium ${due.tone}`}>{due.text}</span>}
        </div>
      </div>

      {/* Always visible on touch screens, revealed on hover on desktop */}
      <div className="flex shrink-0 gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button variant="ghost" size="xs" onClick={() => onEdit(task)} disabled={busy}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onDelete(task)}
          disabled={busy}
          className="text-danger hover:bg-danger-subtle hover:text-danger"
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
