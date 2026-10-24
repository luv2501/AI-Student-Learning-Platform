import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  HelpCircle,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  XCircle,
  History,
  Target,
  Sparkles,
  ArrowRight,
  Clock,
  X,
} from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api.js';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import Modal from '../ui/Modal.jsx';
import GeneratePrompt, { PanelShell, useAiPanel } from './GeneratePrompt.jsx';

export default function QuizPanel({ document: doc, onGenerated }) {
  const { data, loading, error, run, setError } = useAiPanel(doc._id, 'quiz', onGenerated);
  const baseQuestions = data ?? (doc.quiz?.length ? doc.quiz : null);

  const [targetedQuestions, setTargetedQuestions] = useState(null);
  const [targetedTopics, setTargetedTopics] = useState([]);
  const [loadingTargeted, setLoadingTargeted] = useState(false);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [weakSpots, setWeakSpots] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);

  // Active question set: targeted quiz if active, otherwise base questions
  const questions = targetedQuestions || baseQuestions;

  // Load past attempts and weak spots for this document
  const loadAttempts = useCallback(async () => {
    if (!doc?._id) return;
    try {
      const res = await api.get(`/documents/${doc._id}/quizzes/attempts`);
      setAttempts(res.data?.attempts || []);
      setWeakSpots(res.data?.weakSpots || []);
    } catch {
      // Non-fatal
    }
  }, [doc?._id]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  // Submit quiz attempt and persist to backend
  async function handleSubmit() {
    if (!questions || answered < questions.length) return;

    setSubmitted(true);
    const correctCount = questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const totalCount = questions.length;
    const currentPercent = Math.round((correctCount / totalCount) * 100);

    const answersPayload = questions.map((q, i) => {
      const chosenIndex = answers[i];
      const selectedOption = chosenIndex !== undefined ? q.options[chosenIndex] : '';
      const correctOption = q.options[q.correctIndex] || '';
      const isCorrect = chosenIndex === q.correctIndex;
      return {
        question: q.question,
        selectedOption,
        correctOption,
        isCorrect,
        topic: q.topic || 'General',
      };
    });

    setSavingAttempt(true);
    try {
      const res = await api.post('/quizzes/attempts', {
        documentId: doc._id,
        answers: answersPayload,
        isTargeted: Boolean(targetedQuestions),
        topicsPracticed: targetedTopics,
      });

      if (res.data?.attempt) {
        setAttempts((prev) => [res.data.attempt, ...prev]);
      }
      if (res.data?.weakSpots) {
        setWeakSpots(res.data.weakSpots);
      }

      toast.success(`Quiz complete: ${correctCount} of ${totalCount} correct (${currentPercent}%)`, {
        description:
          currentPercent >= 80
            ? 'Strong result. Review any missed items below.'
            : 'Result saved to your history. Review the explanations below.',
      });
    } catch (err) {
      toast.error('Could not save attempt', {
        description: apiErrorMessage(err),
      });
    } finally {
      setSavingAttempt(false);
    }
  }

  // Trigger targeted practice on detected weak topics
  async function startTargetedPractice(topicsToPractice) {
    setLoadingTargeted(true);
    setError('');
    try {
      const res = await api.post('/ai/quiz/weak-spots', {
        documentId: doc._id,
        topics: topicsToPractice || weakSpots.map((w) => w.topic),
      });

      setTargetedQuestions(res.data?.questions || []);
      setTargetedTopics(res.data?.topics || []);
      setAnswers({});
      setSubmitted(false);

      toast.success('Targeted quiz generated', {
        description: `5 questions focusing on: ${(res.data?.topics || []).join(', ')}.`,
      });
    } catch (err) {
      toast.error('Failed to generate targeted quiz', {
        description: apiErrorMessage(err),
      });
    } finally {
      setLoadingTargeted(false);
    }
  }

  function exitTargetedPractice() {
    setTargetedQuestions(null);
    setTargetedTopics([]);
    setAnswers({});
    setSubmitted(false);
    toast.info('Returned to standard quiz');
  }

  function reset(regenerate = false) {
    setAnswers({});
    setSubmitted(false);
    if (regenerate) {
      setTargetedQuestions(null);
      setTargetedTopics([]);
      run(true);
    } else {
      toast.info('Quiz reset', { description: 'Answers cleared. Start fresh.' });
    }
  }

  if (!questions && !loadingTargeted) {
    return (
      <GeneratePrompt
        icon={HelpCircle}
        title="Practice Quiz"
        text="Generate multiple-choice questions from this document, test your retention, and identify knowledge gaps."
        label="Generate quiz"
        loading={loading}
        error={error}
        onDismissError={() => setError('')}
        onGenerate={run}
      />
    );
  }

  const score = questions ? questions.filter((q, i) => answers[i] === q.correctIndex).length : 0;
  const answered = questions ? questions.filter((_, i) => answers[i] !== undefined).length : 0;
  const answeredAll = questions ? answered === questions.length : false;
  const percent = questions && questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const scoreColor =
    percent >= 80 ? 'text-success' : percent >= 50 ? 'text-warning' : 'text-danger';
  const progressTone =
    percent >= 80 ? 'emerald' : percent >= 50 ? 'amber' : 'indigo';

  return (
    <PanelShell
      title="Practice Quiz"
      subtitle={
        targetedQuestions
          ? `Targeted practice: ${targetedTopics.join(', ')} (${questions.length} questions)`
          : `${questions?.length || 0} questions${submitted ? ` · scored ${score} of ${questions?.length || 0}` : ''}`
      }
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          {attempts.length > 0 && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setShowHistory(true)}
              className="gap-1.5"
            >
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              <span>History</span>
              <span className="font-mono text-[10px] text-muted">({attempts.length})</span>
            </Button>
          )}

          {targetedQuestions ? (
            <Button
              variant="secondary"
              size="xs"
              onClick={exitTargetedPractice}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Exit targeted quiz
            </Button>
          ) : (
            weakSpots.length > 0 && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => startTargetedPractice()}
                disabled={loadingTargeted}
                className="gap-1.5 text-accent border-accent/30 hover:bg-accent-subtle/30"
              >
                {loadingTargeted ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <Target className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                )}
                <span>Practice weak spots</span>
              </Button>
            )
          )}

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
            disabled={loading || loadingTargeted}
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
      {/* Targeted Quiz Active Banner */}
      {targetedQuestions && (
        <Card className="border-accent/30 bg-accent-subtle/15 p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-subtle text-accent border border-accent/25">
                <Target className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">
                  Targeted Weak Spots Practice
                </p>
                <p className="text-[11px] text-secondary">
                  Practicing: {targetedTopics.join(', ')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={exitTargetedPractice}
              className="self-end sm:self-center text-xs"
            >
              Return to standard quiz
            </Button>
          </div>
        </Card>
      )}

      {/* Weak Spots Detection Banner (shown when gaps exist on document) */}
      {!targetedQuestions && weakSpots.length > 0 && !submitted && (
        <Card className="border-warning/30 bg-warning-subtle/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-warning/30 bg-warning-subtle text-warning">
                <Target className="h-4 w-4 stroke-[2]" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold tracking-tight text-primary">
                    Weak Spots Detected in This Document
                  </h4>
                  <Badge tone="amber" className="font-mono text-[10px]">
                    {weakSpots.length} topic{weakSpots.length === 1 ? '' : 's'}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-secondary">
                  Lower accuracy observed on past attempts. Generate a focused 5-question review to close knowledge gaps.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {weakSpots.map((ws) => (
                    <span
                      key={ws.topic}
                      className="inline-flex items-center gap-1 rounded-sm border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[11px] text-secondary"
                    >
                      <span className="font-medium text-primary">{ws.topic}</span>
                      <span className="text-muted">· {ws.accuracy}% acc ({ws.missedCount} missed)</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => startTargetedPractice()}
                disabled={loadingTargeted}
                className="gap-1.5 shadow-xs whitespace-nowrap"
              >
                {loadingTargeted ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>Practice weak spots</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Score Summary Card: shown after submission */}
      {submitted ? (
        <Card>
          <div className="flex flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left sm:px-6">
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

            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-medium text-primary">
                {percent === 100
                  ? 'Perfect score. This material is fully mastered.'
                  : percent >= 80
                  ? 'Strong result. Review any missed items below.'
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
          value={(answered / (questions?.length || 1)) * 100}
          label={`${answered} of ${questions?.length || 0} answered`}
        />
      )}

      {/* Question list */}
      {questions &&
        questions.map((q, i) => {
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
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-relaxed text-primary">
                    <span className="mr-2 font-mono text-xs text-muted">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    {q.question}
                  </p>
                  {q.topic && (
                    <span className="inline-block font-mono text-[11px] text-muted">
                      Topic: <span className="text-secondary">{q.topic}</span>
                    </span>
                  )}
                </div>
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

      {/* Submit row: sticky at bottom while answering */}
      {!submitted && questions && (
        <div className="sticky bottom-4 pt-2">
          <Button
            fullWidth
            size="md"
            onClick={handleSubmit}
            disabled={!answeredAll || savingAttempt}
          >
            {savingAttempt ? (
              <span className="flex items-center gap-2">
                <Spinner aria-hidden="true" />
                <span>Saving attempt...</span>
              </span>
            ) : answeredAll ? (
              'Check my answers'
            ) : (
              `Answer ${questions.length - answered} more question${
                questions.length - answered === 1 ? '' : 's'
              }`
            )}
          </Button>
        </div>
      )}

      {/* Past Attempts History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        maxWidth="max-w-lg"
        className="p-6"
        ariaLabel="Past Attempts History"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-subtle text-accent">
                <History className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-primary">
                  Quiz Attempt History
                </h3>
                <p className="font-mono text-xs text-muted">
                  {attempts.length} recorded attempt{attempts.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              aria-label="Close history modal"
              className="rounded-md p-1.5 text-muted hover:text-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {attempts.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              No attempts recorded yet for this document.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle max-h-96 overflow-y-auto pr-1">
              {attempts.map((att) => {
                const attScoreColor =
                  att.score >= 80
                    ? 'border-success/30 bg-success-subtle text-success'
                    : att.score >= 50
                    ? 'border-warning/30 bg-warning-subtle text-warning'
                    : 'border-danger/30 bg-danger-subtle text-danger';

                const formattedDate = new Date(att.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={att._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-secondary">{formattedDate}</span>
                        {att.isTargeted && (
                          <Badge tone="indigo" className="font-mono text-[10px]">
                            Targeted
                          </Badge>
                        )}
                      </div>
                      <p className="font-mono text-xs text-muted">
                        {att.correctCount} of {att.totalQuestions} questions correct
                      </p>
                    </div>

                    <span className={`rounded-sm border px-2 py-0.5 font-mono text-xs font-semibold ${attScoreColor}`}>
                      {att.score}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowHistory(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </PanelShell>
  );
}
