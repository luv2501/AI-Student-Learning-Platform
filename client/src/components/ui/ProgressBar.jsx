const tones = {
  indigo: 'bg-accent',
  emerald: 'bg-success',
  amber: 'bg-warning',
};

export default function ProgressBar({ value = 0, tone = 'indigo', className = '', label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const toneClass = tones[tone] || tones.indigo;

  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-primary">{label}</span>
          <span className="font-mono text-muted">{pct}%</span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-xs bg-subtle border border-border-subtle/40"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-xs transition-all duration-500 ease-out ${toneClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Circular variant used on the dashboard. */
export function ProgressRing({ value = 0, size = 88, children }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center font-mono">{children}</div>
    </div>
  );
}
