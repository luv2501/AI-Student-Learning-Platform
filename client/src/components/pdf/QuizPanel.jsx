import { useState } from 'react';
import { toast } from 'sonner';
import { HelpCircle, RefreshCw, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import GeneratePrompt, { PanelShell, useAiPanel } from './GeneratePrompt.jsx';

export default function QuizPanel({ document: doc, onGenerated }) {
  const { data, loading, error, run, setError } = useAiPanel(doc._id, 'quiz', onGenerated);
  const questions = data ?? (doc.quiz?.length ? doc.quiz : null);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions) {
    return (
      <GeneratePrompt
        icon={HelpCircle}
        title="Practice Quiz"
        text="Generate multiple-choice questions from this document and test how well you have actually retained the material."
        label="Generate quiz"
        loading={loading}
        error={error}
        onDismissError={() => setError('')}
        onGenerate={run}
      />
    );
  }

  const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const answered = questions.filter((_, i) => answers[i] !== undefined).length;
  const answeredAll = answered === questions.length;
  const percent = Math.round((score / questions.length) * 100);

  function handleSubmit() {
    setSubmitted(true);
    toast.success(`Quiz complete: ${score} / ${questions.length} correct`, {
      description:
        percent >= 80
          ? 'Strong result. Review any missed items below.'
          : 'Check the explanations below and try again.',
    });
  }

  function reset(regenerate = false) {
    setAnswers({});
    setSubmitted(false);
    if (regenerate) {
      run(true);
    } else {
      toast.info('Quiz reset', { description: 'Answers cleared. Start fresh.' });
    }
  }

  const scoreColor =
    percent >= 80 ? 'text-success' : percent >= 50 ? 'text-warning' : 'text-danger';
  const progressTone =
    percent >= 80 ? 'emerald' : percent >= 50 ? 'amber' : 'indigo';

  return (
    <PanelShell
      title="Practice Quiz"
      subtitle={`${questions.length} question${questions.length === 1 ? '' : 's'}${submitted ? ` · scored ${score} / ${questions.length}` : ''}`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          {submitted && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => reset(false)}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => reset(true)}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <Spinner aria-hidden="true" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            New quiz
          </Button>
        </>
      }
    >
      {/* Score summary card — shown after submission */}
      {submitted ? (
        <Card>
          <div className="flex flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left sm:px-6">
            {/* Score metric */}
            <div className="shrink-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
                Your Score
              </p>
              <p className={`mt-1 font-mono text-4xl font-semibold tracking-tight sm:text-5xl ${scoreColor}`}>
                {String(score).padStart(2, '0')}
                <span className="text-xl font-normal text-muted">
                  /{String(questions.length).padStart(2, '0')}
                </span>
              </p>
              {/* Percentage chip */}
              <span
                className={`mt-2 inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs font-semibold ${
                  percent >= 80
                    ? 'border-success/30 bg-success-subtle text-success'
                    : percent >= 50
                    ? 'border-warning/30 bg-warning-subtle text-warning'
                    : 'border-danger/30 bg-danger-subtle text-danger'
                }`}
              >
                {percent}%
              </span>
            </div>

            {/* Feedback text & progress bar */}
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-medium text-primary">
                {percent === 100
                  ? 'Perfect score. This material is fully mastered.'
                  : percent >= 80
                  ? 'Strong result. Review the missed items below.'
                  : percent >= 50
                  ? 'Decent recall. Check the explanations and retry.'
                  : 'Review the study notes before attempting again.'}
              </p>
              <ProgressBar value={percent} tone={progressTone} />
              <div className="flex items-center gap-3 text-xs text-muted font-mono">
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {score} correct
                </span>
                <span className="flex items-center gap-1 text-danger">
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {questions.length - score} incorrect
                </span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <ProgressBar
          value={(answered / questions.length) * 100}
          label={`${answered} of ${questions.length} answered`}
        />
      )}

      {/* Question list */}
      {questions.map((q, i) => {
        const correct = submitted && answers[i] === q.correctIndex;
        const wrong = submitted && answers[i] !== q.correctIndex;

        return (
          <Card
            key={i}
            className={
              submitted
                ? correct
                  ? 'border-success/40 bg-success-subtle/20'
                  : 'border-danger/40 bg-danger-subtle/20'
                : ''
            }
          >
            {/* Question header */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-relaxed text-primary">
                <span className="mr-2 font-mono text-xs text-muted">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                {q.question}
              </p>
              {submitted && (
                <Badge tone={correct ? 'emerald' : 'rose'} className="shrink-0">
                  {correct ? 'Correct' : 'Missed'}
                </Badge>
              )}
            </div>

            {/* Answer options */}
            <div className="mt-3.5 space-y-2" role="group" aria-label={`Options for question ${i + 1}`}>
              {q.options.map((option, oi) => {
                const chosen = answers[i] === oi;
                const isCorrectAnswer = q.correctIndex === oi;

                let style =
                  'border-border-subtle bg-surface hover:border-primary/40 hover:bg-subtle/50 text-secondary';
                if (submitted && isCorrectAnswer) {
                  style = 'border-success/50 bg-success-subtle text-success font-medium';
                } else if (submitted && chosen) {
                  style = 'border-danger/50 bg-danger-subtle text-danger line-through';
                } else if (submitted) {
                  style = 'border-border-subtle/40 text-muted opacity-55';
                } else if (chosen) {
                  style = 'border-accent bg-accent-subtle text-accent ring-1 ring-accent/40';
                }

                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers({ ...answers, [i]: oi })}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${style}`}
                    aria-pressed={chosen && !submitted}
                  >
                    {/* Option letter indicator */}
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-sm font-mono text-xs font-semibold border ${
                        chosen || (submitted && isCorrectAnswer)
                          ? 'border-transparent bg-current/10 text-current'
                          : 'border-border-subtle text-muted'
                      }`}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation after submission */}
            {submitted && q.explanation && (
              <div
                className={`mt-3.5 rounded-md border px-3.5 py-2.5 text-xs leading-relaxed ${
                  wrong
                    ? 'border-warning/30 bg-warning-subtle text-warning'
                    : 'border-border-subtle bg-subtle text-secondary'
                }`}
              >
                <span className="font-semibold text-primary">Explanation: </span>
                {q.explanation}
              </div>
            )}
          </Card>
        );
      })}

      {/* Submit row — sticky at bottom while answering */}
      {!submitted && (
        <div className="sticky bottom-4 pt-2">
          <Button fullWidth size="md" onClick={handleSubmit} disabled={!answeredAll}>
            {answeredAll
              ? 'Check my answers'
              : `Answer ${questions.length - answered} more question${
                  questions.length - answered === 1 ? '' : 's'
                }`}
          </Button>
        </div>
      )}
    </PanelShell>
  );
}
