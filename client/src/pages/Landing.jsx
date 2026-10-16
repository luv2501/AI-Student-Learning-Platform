import { Link } from 'react-router-dom';
import {
  FileText,
  Layers,
  HelpCircle,
  MessageSquare,
  CheckSquare,
  BarChart3,
  ArrowRight,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

const features = [
  {
    icon: FileText,
    title: 'AI study notes',
    text: 'A clean summary, key takeaways, and section-by-section bullets synthesized from your uploaded PDF.',
  },
  {
    icon: Layers,
    title: 'Flashcards',
    text: 'Auto-generated question and answer cards with keyboard navigation, shuffle, and self-marking recall.',
  },
  {
    icon: HelpCircle,
    title: 'Practice quizzes',
    text: 'Multiple-choice questions with instant scoring, progress metrics, and conceptual rationale explanations.',
  },
  {
    icon: MessageSquare,
    title: 'Ask your PDF',
    text: 'Ask anything about a document and get precise, verified answers grounded strictly in its contents.',
  },
  {
    icon: CheckSquare,
    title: 'Task tracking',
    text: 'Plan study sessions by subject, priority, and due dates with clear completion metrics.',
  },
  {
    icon: BarChart3,
    title: 'Progress metrics',
    text: 'Monitor due today, overdue items, and completion percentages across all your subjects at a glance.',
  },
];

const steps = [
  {
    step: '01',
    icon: UploadCloud,
    title: 'Upload document',
    text: 'Drop lecture slides, textbook chapters, or reference PDFs directly into your library.',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'Generate materials',
    text: 'Produce verified notes, flashcards, and quizzes in a unified, distraction-free workspace.',
  },
  {
    step: '03',
    icon: CheckSquare,
    title: 'Study and track',
    text: 'Test retention, flip flashcards, and cross tasks off your dashboard until exam day.',
  },
];

export default function Landing() {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Editorial Restrained Hero */}
      <section className="relative rounded-2xl border border-border-subtle bg-surface px-6 py-14 text-center shadow-xs sm:px-12 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Badge tone="indigo" className="mb-4">
            FileSense — Understand every document
          </Badge>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary sm:text-5xl leading-tight">
            Understand every document with FileSense
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-secondary sm:text-base">
            FileSense analyzes your study documents to build high-utility notes, active recall flashcards, and practice quizzes — keeping your entire revision plan grounded and on schedule.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Get started with FileSense
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <div className="text-center">
          <Badge tone="slate">Editorial System</Badge>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            Built around how students actually revise
          </h2>
          <p className="mt-1 text-xs text-secondary max-w-md mx-auto">
            Zero noise, no distracting fluff. Only high-contrast, structured study tools.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const IconComponent = f.icon;
            return (
              <Card
                key={f.title}
                hover
                className="animate-rise flex flex-col justify-between"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div>
                  <span className="grid h-9 w-9 place-items-center rounded-md border border-border-subtle bg-subtle text-accent">
                    <IconComponent className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3.5 text-sm font-semibold tracking-tight text-primary">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-secondary">{f.text}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
          Three steps to a complete study workflow
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => {
            const StepIcon = s.icon;
            return (
              <Card key={s.step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border-subtle bg-subtle text-accent">
                  <StepIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="mt-3 inline-block font-mono text-xs font-semibold text-muted">
                  STEP {s.step}
                </span>
                <h3 className="mt-1 text-sm font-semibold tracking-tight text-primary">{s.title}</h3>
                <p className="mt-1 text-xs text-secondary leading-relaxed">{s.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-xl border border-border-subtle bg-surface px-6 py-12 text-center shadow-xs">
        <h2 className="text-xl font-semibold tracking-tight text-primary sm:text-2xl">
          Ready to understand every document?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-secondary">
          Free to start. Upload a PDF and generate your first set of notes in under a minute with FileSense.
        </p>
        <Link to="/register" className="mt-6 inline-block">
          <Button size="lg">Get started with FileSense</Button>
        </Link>
      </section>
    </div>
  );
}
