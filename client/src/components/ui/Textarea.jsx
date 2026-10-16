export default function Textarea({ label, id, hint, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-primary">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full resize-y rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-primary outline-none transition-colors duration-150 placeholder:text-muted hover:border-primary/40 focus:border-accent focus:ring-1 focus:ring-accent ${className}`}
        {...props}
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
