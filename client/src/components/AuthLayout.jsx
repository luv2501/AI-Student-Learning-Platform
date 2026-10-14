import Card from './ui/Card.jsx';

const points = [
  'AI notes, flashcards and quizzes from your own PDFs',
  'Ask questions about any document you upload',
  'Track revision tasks and progress until exam day',
];

/** Shared two-column shell for the login and register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid items-center gap-8 py-4 lg:grid-cols-2 lg:gap-12 lg:py-10">
      <div className="hidden lg:block">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900">
          Your AI study workspace, ready when you are
        </h2>
        <ul className="mt-6 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
                ✓
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-md">
        <Card padding="lg" className="animate-rise">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          {children}
        </Card>
        {footer && <div className="mt-4 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}
