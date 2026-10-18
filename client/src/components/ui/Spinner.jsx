export default function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 py-20 text-secondary">
      <Spinner className="h-5 w-5 text-accent" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

/** Shown while the AI is working: sets expectations about the wait. */
export function ThinkingState({ label = 'The AI is working on it', hint = 'This usually takes 10-30 seconds' }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-accent"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-primary">{label}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}
