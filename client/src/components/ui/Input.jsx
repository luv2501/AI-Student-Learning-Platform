export default function Input({ label, id, hint, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-primary">
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-primary outline-none transition-colors duration-150 placeholder:text-muted disabled:bg-subtle disabled:text-muted disabled:cursor-not-allowed ${
          error
            ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
            : 'border-border-subtle hover:border-primary/40 focus:border-accent focus:ring-1 focus:ring-accent'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
