import Card from './Card.jsx';

const tones = {
  indigo: {
    value: 'text-accent',
    chip: 'bg-accent-subtle text-accent border-accent/25',
  },
  emerald: {
    value: 'text-success',
    chip: 'bg-success-subtle text-success border-success/25',
  },
  amber: {
    value: 'text-warning',
    chip: 'bg-warning-subtle text-warning border-warning/25',
  },
  rose: {
    value: 'text-danger',
    chip: 'bg-danger-subtle text-danger border-danger/25',
  },
  slate: {
    value: 'text-primary',
    chip: 'bg-subtle text-muted border-border-subtle',
  },
};

export default function StatCard({ label, value, hint, icon, tone = 'slate', className = '' }) {
  const style = tones[tone] || tones.slate;

  return (
    <Card padding="sm" hover className={className}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
        {icon && (
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border text-sm ${style.chip}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-2 font-mono text-2xl font-semibold tracking-tight ${style.value}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
