import { Check } from 'lucide-react';
import Card from './ui/Card.jsx';

const points = [
  'AI notes, flashcards and quizzes from your own documents',
  'Understand every document and ask questions with AI',
  'Track study tasks and progress until exam day',
];

/** Shared two-column shell for the login and register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid items-center gap-8 py-4 lg:grid-cols-2 lg:gap-12 lg:py-10">
      <div className="hidden lg:block">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-primary">
          FileSense — Understand every document
        </h2>
        <ul className="mt-6 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-secondary">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border border-success/30 bg-success-subtle text-success">
                <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-md">
        <Card padding="lg" className="animate-rise">
          <h1 className="text-xl font-semibold tracking-tight text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-xs text-secondary">{subtitle}</p>}
          {children}
        </Card>
        {footer && <div className="mt-4 text-center text-xs text-muted">{footer}</div>}
      </div>
    </div>
  );
}
