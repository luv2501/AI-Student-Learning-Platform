export default function Select({ label, id, hint, className = '', children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-primary">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full appearance-none rounded-md border border-border-subtle bg-surface bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat px-3 py-2 pr-9 text-sm text-primary outline-none transition-colors duration-150 hover:border-primary/40 focus:border-accent focus:ring-1 focus:ring-accent ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath d='M5.5 7.5 10 12l4.5-4.5'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
