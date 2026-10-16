import { FileText, Layers, CheckSquare, MessageSquare, ShieldCheck } from 'lucide-react';
import Card from './ui/Card.jsx';

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Grounded Question Answering',
    description: 'Ask questions about complex readings and receive direct answers grounded in your course documents.',
  },
  {
    icon: FileText,
    title: 'Structured Study Notes',
    description: 'Convert dense textbooks and slide decks into clear outlines, definitions, and chapter summaries.',
  },
  {
    icon: Layers,
    title: 'Active Recall Flashcards',
    description: 'Master core concepts through automatically extracted question-and-answer study pairs.',
  },
  {
    icon: CheckSquare,
    title: 'Evaluative Quizzes',
    description: 'Test your understanding before exam day with multiple-choice questions and explanations.',
  },
];

/** Shared editorial two-column shell for the login and register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid items-center gap-10 py-6 lg:grid-cols-12 lg:gap-14 lg:py-12">
      {/* Left Panel: Editorial Product Showcase (Desktop) */}
      <div className="hidden lg:col-span-7 lg:block space-y-8 pr-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-xs border border-border-subtle bg-surface px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-secondary">
            <ShieldCheck className="h-3.5 w-3.5 text-accent stroke-[2.2]" aria-hidden="true" />
            <span>Document Intelligence</span>
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-primary xl:text-4xl">
            Turn dense course material into mastered knowledge.
          </h2>
          <p className="text-sm leading-relaxed text-secondary max-w-xl">
            Upload lecture notes, textbooks, and research papers. FileSense extracts verified facts and generates structured study aids with zero hallucinations.
          </p>
        </div>

        {/* Feature Capabilities Breakdown */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-lg border border-border-subtle bg-surface p-4 transition-colors hover:border-primary/20"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-border-subtle bg-subtle text-accent">
                    <Icon className="h-4 w-4 stroke-[2]" aria-hidden="true" />
                  </span>
                  <h3 className="text-xs font-semibold tracking-tight text-primary">{item.title}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-secondary">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Quiet Trust Proof Line */}
        <div className="flex items-center gap-2 border-t border-border-subtle pt-4 text-xs font-mono text-muted">
          <span>Private and secure</span>
          <span>•</span>
          <span>Per-document vector isolation</span>
          <span>•</span>
          <span>Zero third-party training</span>
        </div>
      </div>

      {/* Right Panel: High-Contrast Accessible Form Container */}
      <div className="mx-auto w-full max-w-md lg:col-span-5">
        <Card padding="lg" className="animate-rise border border-border-subtle bg-surface shadow-xs">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-primary">{title}</h1>
            {subtitle && <p className="text-xs leading-relaxed text-secondary">{subtitle}</p>}
          </div>
          {children}
        </Card>
        {footer && <div className="mt-4 text-center text-xs text-muted">{footer}</div>}
      </div>
    </div>
  );
}
