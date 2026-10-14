import Card from './Card.jsx';

const tones = {
  indigo: { value: 'text-indigo-600', chip: 'bg-indigo-50 text-indigo-600' },
  emerald: { value: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600' },
  amber: { value: 'text-amber-600', chip: 'bg-amber-50 text-amber-600' },
  rose: { value: 'text-rose-600', chip: 'bg-rose-50 text-rose-600' },
  slate: { value: 'text-slate-900', chip: 'bg-slate-100 text-slate-500' },
};

export default function StatCard({ label, value, hint, icon, tone = 'slate', className = '' }) {
  const style = tones[tone];

  return (
    <Card padding="sm" hover className={className}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon && (
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm ${style.chip}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${style.value}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
