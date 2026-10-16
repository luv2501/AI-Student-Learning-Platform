import { Link } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

const features = [
  {
    icon: '📝',
    title: 'AI study notes',
    text: 'A clean summary, the key points and section bullets from any lecture PDF.',
  },
  {
    icon: '🃏',
    title: 'Flashcards',
    text: 'Auto generated question and answer cards, with shuffle and self marking.',
  },
  {
    icon: '🎯',
    title: 'Practice quizzes',
    text: 'Multiple choice questions with instant scoring and explanations.',
  },
  {
    icon: '💬',
    title: 'Ask your PDF',
    text: 'Ask anything about a document and get answers grounded in its content.',
  },
  {
    icon: '✅',
    title: 'Task tracking',
    text: 'Plan revision by subject and priority, with due dates and progress.',
  },
  {
    icon: '📊',
    title: 'Progress at a glance',
    text: 'See what is due today, what is overdue and how much you have finished.',
  },
];

const steps = [
  { step: '1', title: 'Upload a PDF', text: 'Lecture slides, a chapter, or your own notes.' },
  { step: '2', title: 'Generate material', text: 'Notes, flashcards and a quiz in one workspace.' },
  { step: '3', title: 'Study and track', text: 'Test yourself and tick off tasks until exam day.' },
];

export default function Landing() {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-16 text-center text-white shadow-xl shadow-indigo-900/10 sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)',
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-100 ring-1 ring-white/20">
            FileSense — Understand every document
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Understand every document with FileSense
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-indigo-100 sm:text-lg">
            FileSense reads your documents and builds the notes, flashcards and quizzes you would
            have made yourself — then keeps your revision on track.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-700 shadow-lg hover:bg-indigo-50">
                Get started with FileSense
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="text-white ring-1 ring-white/30 hover:bg-white/10">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center">
          <Badge tone="indigo">Everything in one place</Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Built around how students actually revise
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card
              key={f.title}
              hover
              className="animate-rise"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-xl">
                {f.icon}
              </span>
              <h3 className="mt-3 font-semibold tracking-tight text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Three steps to a full revision set
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.step} className="text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {s.step}
              </span>
              <h3 className="mt-3 font-semibold tracking-tight text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Ready to understand every document?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Free to start. Upload a PDF and see your first set of notes in under a minute with FileSense.
        </p>
        <Link to="/register" className="mt-6 inline-block">
          <Button size="lg">Get started with FileSense</Button>
        </Link>
      </section>
    </div>
  );
}
