import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Layers,
  CheckSquare,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

const workflowSteps = [
  {
    step: '01',
    icon: UploadCloud,
    title: 'Upload lecture or reading PDF',
    text: 'Drop lecture slides, research papers, or syllabus chapters up to 10 MB. FileSense validates magic bytes, extracts the text, and calculates precise page metrics.',
    badge: 'Fast Ingestion',
  },
  {
    step: '02',
    icon: FileText,
    title: 'Structured notes & flashcards',
    text: 'Receive a high-signal executive summary, section-by-section breakdown, and active recall cards equipped with keyboard navigation and self-scoring.',
    badge: 'Active Recall',
  },
  {
    step: '03',
    icon: CheckSquare,
    title: 'Interactive quiz evaluation',
    text: 'Test your retention with multiple-choice assessments. Get instant scoring percentages, performance tiers, and conceptual rationale explanations for every question.',
    badge: 'Self-Testing',
  },
  {
    step: '04',
    icon: MessageSquare,
    title: 'Grounded question answering',
    text: 'Query your materials directly with natural language. Every answer is grounded strictly in the source document text to prevent hallucinations.',
    badge: 'Zero Hallucination',
  },
];

const capabilities = [
  {
    icon: ShieldCheck,
    title: 'Strict Document Grounding',
    text: 'AI generation is restricted solely to the contents of your uploaded document, preventing unsupported claims and invented facts.',
  },
  {
    icon: Layers,
    title: 'Spaced Repetition Ready',
    text: 'Flip cards with the spacebar, shuffle the deck, and track items you need to review again before exam day.',
  },
  {
    icon: Zap,
    title: 'Zero Latency Formatting',
    text: 'Export generated study notes to standard Markdown with one click for offline review or archiving in your local notes app.',
  },
  {
    icon: BookOpen,
    title: 'Multi-Document Library',
    text: 'Keep lecture materials and readings organized by subject with centralized task tracking and study progress rings.',
  },
];

export default function Landing() {
  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Editorial Hero Section */}
      <section className="relative pt-6 sm:pt-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-1 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] font-medium tracking-wide text-secondary uppercase">
              FileSense Student Platform
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-primary sm:text-5xl lg:text-6xl leading-[1.12]">
            Understand every document with FileSense
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
            Upload complex lecture slides, textbook readings, or research papers. FileSense synthesizes verified notes, active recall flashcards, and instant quizzes so you retain what you study.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2 px-6">
                Get started free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="px-6">
                Sign in to account
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-accent" /> Free tier available
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-accent" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-accent" /> Instant PDF analysis
            </span>
          </div>
        </div>

        {/* High-Utility Realistic Inspection Preview Frame */}
        <div className="mt-12 sm:mt-16">
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-xs">
            {/* Window title bar */}
            <div className="flex h-10 items-center justify-between border-b border-border-subtle bg-subtle px-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border border-border-subtle bg-surface" />
                <span className="h-2.5 w-2.5 rounded-full border border-border-subtle bg-surface" />
                <span className="h-2.5 w-2.5 rounded-full border border-border-subtle bg-surface" />
                <span className="ml-2 font-mono text-xs font-medium text-secondary truncate max-w-[200px] sm:max-w-none">
                  cell_metabolism_lecture_04.pdf
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
                <span className="hidden sm:inline">24 pages</span>
                <span className="hidden sm:inline">·</span>
                <span className="rounded-xs border border-success/30 bg-success-subtle px-1.5 py-0.5 text-success">
                  Extracted
                </span>
              </div>
            </div>

            {/* Simulated Workspace Inspection Layout */}
            <div className="grid divide-y divide-border-subtle lg:grid-cols-12 lg:divide-x lg:divide-y-0">
              {/* Document Overview Panel */}
              <div className="p-5 lg:col-span-4 bg-surface space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted">
                    Summary Card
                  </span>
                  <Badge tone="indigo">Notes Ready</Badge>
                </div>
                <h4 className="text-sm font-semibold tracking-tight text-primary">
                  Cellular Respiration & ATP Synthesis
                </h4>
                <p className="text-xs leading-relaxed text-secondary">
                  The primary biochemical mechanism by which cells extract chemical energy from nutrient molecules, converting glucose into usable ATP through glycolysis, the citric acid cycle, and oxidative phosphorylation.
                </p>
                <div className="rounded-md border border-border-subtle bg-subtle p-3 space-y-2">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                    Key Point 01
                  </div>
                  <p className="text-xs text-secondary leading-normal">
                    Glycolysis occurs in the cytosol, generating a net yield of 2 ATP and 2 NADH per glucose without requiring oxygen.
                  </p>
                </div>
              </div>

              {/* Flashcard Evaluation View */}
              <div className="p-5 lg:col-span-4 bg-surface flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted">
                      Active Flashcard
                    </span>
                    <span className="font-mono text-xs text-muted">Card 03 of 12</span>
                  </div>
                  <div className="mt-4 rounded-lg border border-accent/20 bg-accent-subtle/40 p-4 text-center">
                    <Badge tone="indigo" className="mb-2">Question</Badge>
                    <p className="text-xs font-medium text-primary sm:text-sm leading-relaxed">
                      What is the final electron acceptor in the mitochondrial electron transport chain?
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="rounded-md border border-success/30 bg-success-subtle p-2 text-center text-xs font-medium text-success">
                    I knew this (1)
                  </div>
                  <div className="rounded-md border border-border-subtle bg-subtle p-2 text-center text-xs font-medium text-secondary">
                    Review again (2)
                  </div>
                </div>
              </div>

              {/* Assessment & Quiz Output */}
              <div className="p-5 lg:col-span-4 bg-surface space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted">
                    Retention Quiz
                  </span>
                  <span className="font-mono text-xs font-semibold text-success">Score: 4/5 (80%)</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-md border border-border-subtle bg-subtle p-2.5">
                    <p className="text-xs text-primary font-medium">1. Where does the Krebs cycle occur?</p>
                    <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-success font-medium">
                      <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      <span>Mitochondrial Matrix</span>
                    </p>
                  </div>
                  <div className="rounded-md border border-border-subtle bg-subtle p-2.5">
                    <p className="text-xs text-primary font-medium">2. Net ATP produced per glucose molecule:</p>
                    <p className="mt-1 font-mono text-[11px] text-secondary">~30-32 ATP (Aerobic)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured 4-Step Workflow Section */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="slate">Structured Workflow</Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            From raw PDF to retention in four steps
          </h2>
          <p className="mt-2 text-xs text-secondary sm:text-sm">
            A methodical study pipeline designed to eliminate passive reading and replace it with active testing.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.step}
                className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-5 shadow-xs transition-colors hover:border-primary/30"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-muted">
                      STEP {step.step}
                    </span>
                    <Badge tone="slate">{step.badge}</Badge>
                  </div>

                  <div className="mt-4 flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle bg-subtle text-accent">
                    <IconComponent className="h-4.5 w-4.5" aria-hidden="true" />
                  </div>

                  <h3 className="mt-3.5 text-sm font-semibold tracking-tight text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-secondary">
                    {step.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Platform Capabilities Grid */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-10 shadow-xs">
        <div className="max-w-2xl">
          <Badge tone="indigo">Core Principles</Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary">
            Engineered for high utility without distraction
          </h2>
          <p className="mt-1.5 text-xs text-secondary sm:text-sm">
            Every feature in FileSense is optimized for clarity, reading speed, and factual verification.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {capabilities.map((cap) => {
            const CapIcon = cap.icon;
            return (
              <div key={cap.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border-subtle bg-subtle text-accent">
                  <CapIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-primary">
                    {cap.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-secondary">
                    {cap.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* High-Contrast Bottom Callout */}
      <section className="rounded-xl border border-border-subtle bg-surface px-6 py-12 text-center shadow-xs sm:px-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <Badge tone="indigo">Start Studying Today</Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            Ready to understand every document?
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-secondary sm:text-sm">
            Join students using FileSense to turn raw PDFs into structured notes, flashcards, and quizzes in seconds.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/register">
              <Button size="lg" className="gap-2 px-6">
                Create free account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
