const tones = {
  slate: 'bg-subtle text-secondary border-border-subtle',
  indigo: 'bg-accent-subtle text-accent border-accent/25',
  emerald: 'bg-success-subtle text-success border-success/25',
  amber: 'bg-warning-subtle text-warning border-warning/25',
  rose: 'bg-danger-subtle text-danger border-danger/25',
};

export default function Badge({ tone = 'slate', className = '', children }) {
  const toneClass = tones[tone] || tones.slate;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium tracking-tight ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}
