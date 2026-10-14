const styles = {
  error: { box: 'border-rose-200 bg-rose-50 text-rose-800', icon: '!' },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: '✓' },
  info: { box: 'border-indigo-200 bg-indigo-50 text-indigo-800', icon: 'i' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-800', icon: '!' },
};

export default function Alert({ type = 'error', children, onDismiss, className = '' }) {
  if (!children) return null;

  const style = styles[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`animate-fade-in flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${style.box} ${className}`}
    >
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-current/15 text-[10px] font-bold">
        {style.icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded px-1 text-current/60 transition hover:text-current"
        >
          ×
        </button>
      )}
    </div>
  );
}
