import { useState } from 'react';
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
        icon="🎯"
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

  function reset(regenerate = false) {
    setAnswers({});
    setSubmitted(false);
    if (regenerate) run(true);
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
            <Button variant="secondary" size="sm" onClick={() => reset(false)}>
              Try again
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => reset(true)} disabled={loading}>
            {loading && <Spinner />}
            New quiz
          </Button>
        </>
      }
    >
      {submitted ? (
        <Card className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your score</p>
          <p
            className={`mt-1 text-4xl font-semibold tracking-tight ${
              percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-rose-600'
            }`}
          >
            {score}
            <span className="text-2xl text-slate-300">/{questions.length}</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {percent === 100
              ? 'Perfect score — this topic is solid.'
              : percent >= 80
                ? 'Strong result. Review the misses and move on.'
                : percent >= 50
                  ? 'Halfway there. The explanations below will help.'
                  : 'Worth another pass over the notes before retrying.'}
          </p>
          <ProgressBar
            value={percent}
            tone={percent >= 80 ? 'emerald' : percent >= 50 ? 'amber' : 'indigo'}
            className="mx-auto mt-4 max-w-sm"
          />
        </Card>
      ) : (
        <ProgressBar value={(answered / questions.length) * 100} label="Answered" />
      )}

      {questions.map((q, i) => {
        const correct = submitted && answers[i] === q.correctIndex;
        const wrong = submitted && answers[i] !== q.correctIndex;

        return (
          <Card key={i} className={submitted ? (correct ? 'border-emerald-200' : 'border-rose-200') : ''}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-relaxed text-slate-900">
                <span className="mr-1.5 text-slate-400">{i + 1}.</span>
                {q.question}
              </p>
              {submitted && (
                <Badge tone={correct ? 'emerald' : 'rose'}>{correct ? 'Correct' : 'Missed'}</Badge>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {q.options.map((option, oi) => {
                const chosen = answers[i] === oi;
                const isAnswer = q.correctIndex === oi;

                let style = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40';
                if (submitted && isAnswer) style = 'border-emerald-400 bg-emerald-50';
                else if (submitted && chosen) style = 'border-rose-300 bg-rose-50';
                else if (submitted) style = 'border-slate-200 opacity-60';
                else if (chosen) style = 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200';

                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers({ ...answers, [i]: oi })}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all duration-150 disabled:cursor-default ${style}`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold transition ${
                        chosen || (submitted && isAnswer)
                          ? 'border-transparent bg-white/70 text-slate-900'
                          : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="leading-relaxed text-slate-700">{option}</span>
                  </button>
                );
              })}
            </div>

            {submitted && q.explanation && (
              <p
                className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  wrong ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-600'
                }`}
              >
                <b>Why:</b> {q.explanation}
              </p>
            )}
          </Card>
        );
      })}

      {!submitted && (
        <div className="sticky bottom-4">
          <Button fullWidth size="lg" onClick={() => setSubmitted(true)} disabled={!answeredAll}>
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
