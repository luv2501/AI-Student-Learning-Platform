import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Target,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
} from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api.js';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';

export default function WeakSpotsPracticeModal({
  isOpen,
  onClose,
  weakSpots = [],
  onFinished,
}) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [documentId, setDocumentId] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [topics, setTopics] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoading(true);
    setAnswers({});
    setSubmitted(false);

    const targetTopics = weakSpots.slice(0, 3).map((w) => w.topic);

    api
      .post('/ai/quiz/weak-spots', { topics: targetTopics })
      .then((res) => {
        if (!active) return;
        setQuestions(res.data?.questions || []);
        setDocumentId(res.data?.documentId || '');
        setDocumentTitle(res.data?.documentTitle || '');
        setTopics(res.data?.topics || targetTopics);
      })
      .catch((err) => {
        if (!active) return;
        toast.error('Failed to generate targeted quiz', {
          description: apiErrorMessage(err),
        });
        setQuestions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, weakSpots]);

  const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const answered = questions.filter((_, i) => answers[i] !== undefined).length;
  const answeredAll = questions.length > 0 && answered === questions.length;
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  async function handleSubmit() {
    if (!answeredAll || submitting) return;

    setSubmitted(true);
    setSubmitting(true);

    const answersPayload = questions.map((q, i) => {
      const chosenIndex = answers[i];
      return {
        question: q.question,
        selectedOption: chosenIndex !== undefined ? q.options[chosenIndex] : '',
        correctOption: q.options[q.correctIndex] || '',
        isCorrect: chosenIndex === q.correctIndex,
        topic: q.topic || 'General',
      };
    });

    try {
      await api.post('/quizzes/attempts', {
        documentId,
        answers: answersPayload,
        isTargeted: true,
        topicsPracticed: topics,
      });

      toast.success(`Targeted practice complete: ${score} of ${questions.length} correct`, {
        description: 'Your results have been recorded to recalculate your knowledge gaps.',
      });
      onFinished?.();
    } catch (err) {
      toast.error('Failed to log attempt', {
        description: apiErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onClose?.();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-2xl"
      className="p-6 max-h-[90vh] overflow-y-auto"
      ariaLabel="Targeted Weak Spots Practice"
    >
      <div className="space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-warning/30 bg-warning-subtle text-warning">
              <Target className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-primary">
                Targeted Weak Spots Practice
              </h3>
              <p className="font-mono text-xs text-muted">
                {documentTitle ? `Source: ${documentTitle}` : 'Remediating knowledge gaps'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close weak spots practice"
            className="rounded-md p-1.5 text-muted hover:text-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-60 flex-col items-center justify-center gap-3 py-12">
            <Spinner aria-hidden="true" />
            <p className="font-mono text-xs text-muted">
              Generating 5 targeted questions for {topics.join(', ') || 'knowledge gaps'}...
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">
            Could not generate practice questions at this time. Please ensure you have documents with extracted text.
          </div>
        ) : (
          <>
            {/* Topic chips header */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs text-muted">Practicing:</span>
              {topics.map((t) => (
                <span
                  key={t}
                  className="rounded-sm border border-border-subtle bg-subtle px-2 py-0.5 font-mono text-[11px] text-secondary"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Score summary after submission */}
            {submitted ? (
              <Card className="border-accent/30 bg-accent-subtle/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted">Targeted Score</p>
                    <p className="font-mono text-2xl font-semibold text-primary">
                      {score} / {questions.length} ({percent}%)
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </Card>
            ) : (
              <ProgressBar
                value={(answered / questions.length) * 100}
                label={`${answered} of ${questions.length} answered`}
              />
            )}

            {/* Question List */}
            <div className="space-y-4">
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
                      <div>
                        <p className="text-sm font-medium text-primary">
                          <span className="mr-2 font-mono text-xs text-muted">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          {q.question}
                        </p>
                        {q.topic && (
                          <span className="mt-0.5 inline-block font-mono text-[10px] text-muted">
                            Topic: {q.topic}
                          </span>
                        )}
                      </div>
                      {submitted && (
                        <Badge tone={correct ? 'emerald' : 'rose'} className="shrink-0 font-mono text-[10px]">
                          {correct ? 'Correct' : 'Missed'}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
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
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-left text-xs transition-colors disabled:cursor-default ${style}`}
                          >
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-sm font-mono text-[11px] font-semibold border ${
                                chosen || (submitted && isCorrectAnswer)
                                  ? 'border-transparent bg-current/10 text-current'
                                  : 'border-border-subtle text-muted'
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {submitted && q.explanation && (
                      <div
                        className={`mt-3 rounded-md border p-2.5 text-xs ${
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
            </div>

            {/* Bottom Submit Row */}
            {!submitted && (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  disabled={!answeredAll || submitting}
                >
                  {submitting ? 'Saving results...' : 'Check my answers'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
