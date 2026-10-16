import { useState } from 'react';
import { toast } from 'sonner';
import { HelpCircle, RefreshCw, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
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
        title="Practice quiz"
        text="Generate multiple choice questions from this PDF and check how much you have actually retained."
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
    toast.success(`Quiz completed: ${score}/${questions.length} (${percent}%)`);
  }

  function reset(regenerate = false) {
    setAnswers({});
    setSubmitted(false);
    if (regenerate) run(true);
    else toast.info('Quiz reset — answers cleared');
  }

  return (
    <PanelShell
      title="Practice quiz"
      subtitle={`${questions.length} questions${submitted ? ` · scored ${score}/${questions.length}` : ''}`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          {submitted && (
            <Button variant="secondary" size="xs" onClick={() => reset(false)} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
          )}
          <Button variant="ghost" size="xs" onClick={() => reset(true)} disabled={loading} className="gap-1">
            {loading ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            New quiz
          </Button>
        </>
      }
    >
      {submitted ? (
        <Card className="text-center">
          <p className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted">Your score</p>
          <p
            className={`mt-1 font-mono text-3xl font-semibold tracking-tight sm:text-4xl ${
              percent >= 80 ? 'text-success' : percent >= 50 ? 'text-warning' : 'text-danger'
            }`}
          >
            {score}
            <span className="text-xl text-muted font-normal">/{questions.length}</span>
          </p>
          <p className="mt-1 text-xs text-secondary">
            {percent === 100
              ? 'Perfect score — this material is completely mastered.'
              : percent >= 80
                ? 'Strong result. Review missed items and move ahead.'
                : percent >= 50
                  ? 'Decent recall. Check the rationales below.'
                  : 'Review the study notes before retrying.'}
          </p>
          <ProgressBar
            value={percent}
            tone={percent >= 80 ? 'emerald' : percent >= 50 ? 'amber' : 'indigo'}
            className="mx-auto mt-3.5 max-w-sm"
          />
        </Card>
      ) : (
        <ProgressBar value={(answered / questions.length) * 100} label="Answered" />
      )}

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
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium leading-relaxed text-primary sm:text-sm">
                <span className="mr-1.5 font-mono text-muted">{i + 1}.</span>
                {q.question}
              </p>
              {submitted && (
                <Badge tone={correct ? 'emerald' : 'rose'}>
                  {correct ? 'Correct' : 'Missed'}
                </Badge>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {q.options.map((option, oi) => {
                const chosen = answers[i] === oi;
                const isAnswer = q.correctIndex === oi;

                let style =
                  'border-border-subtle bg-surface hover:border-primary/40 hover:bg-subtle/50 text-secondary';
                if (submitted && isAnswer) {
                  style = 'border-success/50 bg-success-subtle text-success font-medium';
                } else if (submitted && chosen) {
                  style = 'border-danger/50 bg-danger-subtle text-danger line-through';
                } else if (submitted) {
                  style = 'border-border-subtle/50 opacity-50 text-muted';
                } else if (chosen) {
                  style = 'border-accent bg-accent-subtle text-accent ring-1 ring-accent';
                }

                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers({ ...answers, [i]: oi })}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2 text-left text-xs transition-colors disabled:cursor-default ${style}`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-sm font-mono text-[11px] font-semibold border ${
                        chosen || (submitted && isAnswer)
                          ? 'border-transparent bg-primary/10 text-primary'
                          : 'border-border-subtle text-muted'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>

            {submitted && q.explanation && (
              <p
                className={`mt-3 rounded-md px-3 py-2 text-xs leading-relaxed border ${
                  wrong
                    ? 'border-warning/30 bg-warning-subtle text-warning'
                    : 'border-border-subtle bg-subtle text-secondary'
                }`}
              >
                <b className="font-semibold">Explanation:</b> {q.explanation}
              </p>
            )}
          </Card>
        );
      })}

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
