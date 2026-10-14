const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({ className = '', padding = 'md', hover = false, children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 ${
        paddings[padding]
      } ${hover ? 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md' : ''} ${className}`}
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
        <h2 className="font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
