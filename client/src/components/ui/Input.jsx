import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  id,
  hint,
  error,
  type = 'text',
  showPasswordToggle = false,
  leftElement,
  rightElement,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const effectiveType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {leftElement && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
            {leftElement}
          </div>
        )}
        <input
          id={id}
          type={effectiveType}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-primary outline-none transition-colors duration-150 placeholder:text-muted disabled:bg-subtle disabled:text-muted disabled:cursor-not-allowed ${
            leftElement ? 'pl-9' : ''
          } ${
            showPasswordToggle || rightElement ? 'pr-10' : ''
          } ${
            error
              ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
              : 'border-border-subtle hover:border-primary/40 focus:border-accent focus:ring-1 focus:ring-accent'
          } ${className}`}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-xs p-1 text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            )}
          </button>
        )}
        {!showPasswordToggle && rightElement && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

