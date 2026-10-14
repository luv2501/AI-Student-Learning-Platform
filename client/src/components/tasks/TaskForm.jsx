import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';

/** Turns an ISO date into the yyyy-mm-dd value an <input type="date"> needs. */
function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const quickDates = [
  { label: 'Today', value: () => addDays(0) },
  { label: 'Tomorrow', value: () => addDays(1) },
  { label: 'In a week', value: () => addDays(7) },
];

export default function TaskForm({ task, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    subject: task?.subject === 'General' ? '' : task?.subject || '',
    priority: task?.priority || 'medium',
    dueDate: toDateInput(task?.dueDate),
    description: task?.description || '',
  });

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function submit(e) {
    e.preventDefault();
    onSave({ ...form, subject: form.subject.trim(), dueDate: form.dueDate || null });
  }

  return (
    <Card className="animate-rise border-indigo-100 ring-1 ring-indigo-50">
      <h2 className="font-semibold tracking-tight text-slate-900">
        {task ? 'Edit study task' : 'New study task'}
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <Input
          id="title"
          name="title"
          label="What do you need to study?"
          placeholder="Revise chapter 7 — integration"
          value={form.title}
          onChange={change}
          maxLength={120}
          autoFocus
          required
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            id="subject"
            name="subject"
            label="Subject"
            placeholder="General"
            value={form.subject}
            onChange={change}
            maxLength={60}
          />
          <Select id="priority" name="priority" label="Priority" value={form.priority} onChange={change}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <div>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              label="Due date"
              value={form.dueDate}
              onChange={change}
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {quickDates.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setForm({ ...form, dueDate: q.value() })}
                  className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Textarea
          id="description"
          name="description"
          label="Notes (optional)"
          rows={3}
          placeholder="Exercises 1-20, then past paper questions"
          value={form.description}
          onChange={change}
          maxLength={1000}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={saving}>
            {saving && <Spinner />}
            {task ? 'Save changes' : 'Add task'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
