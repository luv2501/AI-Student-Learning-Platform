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
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
      <Spinner className="h-6 w-6 text-indigo-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Shown while the AI is working — sets expectations about the wait. */
export function ThinkingState({ label = 'The AI is working on it', hint = 'This usually takes 10-30 seconds' }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}
