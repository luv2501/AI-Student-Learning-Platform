const paddings = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({ className = '', padding = 'md', hover = false, children, ...props }) {
  return (
    <div
      className={`rounded-xl border border-border-subtle bg-surface text-primary shadow-xs transition-colors duration-150 ${
        paddings[padding] || ''
      } ${hover ? 'hover:border-primary/30' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/** Standard card header with an optional action on the right. */
export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="font-medium tracking-tight text-primary text-base">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-secondary">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
