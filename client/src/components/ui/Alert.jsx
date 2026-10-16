import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const styles = {
  error: {
    box: 'border-danger/30 bg-danger-subtle text-danger',
    Icon: AlertCircle,
  },
  success: {
    box: 'border-success/30 bg-success-subtle text-success',
    Icon: CheckCircle2,
  },
  info: {
    box: 'border-accent/30 bg-accent-subtle text-accent',
    Icon: Info,
  },
  warning: {
    box: 'border-warning/30 bg-warning-subtle text-warning',
    Icon: AlertTriangle,
  },
};

export default function Alert({ type = 'error', children, onDismiss, className = '' }) {
  if (!children) return null;

  const style = styles[type] || styles.error;
  const IconComponent = style.Icon;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`animate-fade-in flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm ${style.box} ${className}`}
    >
      <span className="mt-0.5 shrink-0">
        <IconComponent className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 rounded-sm p-0.5 text-current/70 transition hover:text-current focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
