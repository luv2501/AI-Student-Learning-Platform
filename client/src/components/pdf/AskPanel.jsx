import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Send, BookOpen, RotateCcw, FileText, X } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api.js';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import Spinner from '../ui/Spinner.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Modal from '../ui/Modal.jsx';

const examples = [
  'Summarise this in one paragraph',
  'What are the most important definitions?',
  'Explain the hardest concept simply',
  'What might come up in an exam?',
];

export default function AskPanel({ document: doc }) {
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCitation, setActiveCitation] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch persisted ask history on mount or when doc changes
  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!doc?._id) return;
      setHistoryLoading(true);
      try {
        const { data } = await api.get(`/ai/ask/${doc._id}/history`);
        if (active && Array.isArray(data?.history)) {
          const pairs = [];
          for (let i = 0; i < data.history.length; i++) {
            const m = data.history[i];
            if (m.role === 'user') {
              const next = data.history[i + 1];
              if (next && next.role === 'assistant') {
                pairs.push({
                  question: m.content,
                  answer: next.content,
                  citations: next.citations || [],
                  createdAt: next.createdAt,
                });
                i++;
              } else {
                pairs.push({
                  question: m.content,
                  answer: '',
                  citations: [],
                  createdAt: m.createdAt,
                });
              }
            } else if (m.role === 'assistant') {
              pairs.push({
                question: '',
                answer: m.content,
                citations: m.citations || [],
                createdAt: m.createdAt,
              });
            }
          }
          setThread(pairs);
        }
      } catch (err) {
        console.warn('Could not load ask history:', err);
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, [doc?._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [thread, loading]);

  async function ask(text) {
    const asked = (text ?? question).trim();
    if (asked.length < 3) {
      setError('Please type a longer question (at least 3 characters)');
      toast.error('Question too short');
      return;
    }

    setLoading(true);
    setError('');
    setQuestion('');
    try {
      const { data } = await api.post(`/ai/ask/${doc._id}`, { question: asked });
      setThread((t) => [
        ...t,
        {
          question: data.question,
          answer: data.answer,
          citations: data.citations || [],
        },
      ]);
      // Refocus input so the user can ask a follow-up immediately
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
      setQuestion(asked);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    setClearing(true);
    try {
      await api.delete(`/ai/ask/${doc._id}/history`);
      setThread([]);
      setActiveCitation(null);
      setShowClearModal(false);
      toast.success('Conversation history cleared');
    } catch (err) {
      const msg = apiErrorMessage(err);
      toast.error(msg);
    } finally {
      setClearing(false);
    }
  }

  const docTitle = doc.title || doc.originalName;

  return (
    <div className="space-y-4">
      {/* Panel header with clear history action */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-primary">Ask this document</h2>
          <p className="mt-0.5 text-xs text-secondary">
            All answers are grounded strictly in{' '}
            <span className="font-semibold text-primary">{docTitle}</span>.
          </p>
        </div>
        {thread.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading || clearing}
            onClick={() => setShowClearModal(true)}
            className="gap-1.5 text-xs text-secondary hover:text-danger hover:border-danger/30"
            aria-label="Clear conversation history"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Clear history</span>
          </Button>
        )}
      </div>

      {error && (
        <Alert type="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Threaded conversation area */}
      <Card padding="none" className="overflow-hidden">
        <div className="sm-scroll max-h-[28rem] space-y-5 overflow-y-auto p-4 sm:p-5">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-secondary">
              <Spinner size="md" />
              <span className="font-mono text-xs text-muted">Loading saved conversation...</span>
            </div>
          ) : thread.length === 0 && !loading ? (
            <EmptyState
              icon={<MessageSquare className="h-6 w-6 text-muted" aria-hidden="true" />}
              title="Ask anything about this document"
              text="Your questions and AI answers will appear here. Try one of the suggestions below."
              className="py-8"
            />
          ) : (
            thread.map((entry, i) => (
              <div key={i} className="animate-rise space-y-3">
                {/* User message: right-aligned */}
                {entry.question && (
                  <div className="flex justify-end" aria-label="Your question">
                    <p className="max-w-[85%] rounded-xl rounded-br-sm bg-accent px-4 py-2.5 text-sm leading-relaxed text-accent-contrast shadow-xs">
                      {entry.question}
                    </p>
                  </div>
                )}

                {/* AI answer: left-aligned */}
                {entry.answer && (
                  <div className="flex items-start gap-2.5" aria-label="AI answer">
                    {/* AI avatar chip */}
                    <div
                      className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border-subtle bg-subtle"
                      aria-hidden="true"
                    >
                      <BookOpen className="h-3.5 w-3.5 stroke-[1.75] text-accent" />
                    </div>

                    <div className="max-w-[85%] space-y-2">
                      {/* Document badge & citation counter */}
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-xs border border-border-subtle bg-subtle px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted">
                          {docTitle.replace(/\.pdf$/i, '')}
                        </span>
                        {entry.citations?.length > 0 && (
                          <span className="rounded-xs border border-accent/20 bg-accent/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                            {entry.citations.length}{' '}
                            {entry.citations.length === 1 ? 'citation' : 'citations'}
                          </span>
                        )}
                      </div>

                      {/* Answer bubble */}
                      <div className="whitespace-pre-line rounded-xl rounded-tl-sm border border-border-subtle bg-surface px-4 py-3 text-sm leading-relaxed text-secondary shadow-xs">
                        {entry.answer}
                      </div>

                      {/* Clickable Citation Chips */}
                      {entry.citations?.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                              Sources:
                            </span>
                            {entry.citations.map((c, cIdx) => {
                              const isSelected =
                                activeCitation?.itemIdx === i && activeCitation?.citIdx === cIdx;
                              return (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() =>
                                    setActiveCitation(
                                      isSelected ? null : { itemIdx: i, citIdx: cIdx }
                                    )
                                  }
                                  aria-expanded={isSelected}
                                  aria-label={`View supporting passage from page ${c.pageNumber}`}
                                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                                    isSelected
                                      ? 'border-accent bg-accent/10 font-semibold text-accent'
                                      : 'border-border-subtle bg-subtle text-secondary hover:border-primary/40 hover:bg-surface hover:text-primary'
                                  }`}
                                >
                                  <FileText className="h-3 w-3 stroke-[2] opacity-75" aria-hidden="true" />
                                  <span>Page {c.pageNumber}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Active citation expandable callout */}
                          {activeCitation?.itemIdx === i && (
                            <div className="animate-rise rounded-lg border border-border-subtle bg-subtle/70 p-3 text-xs leading-relaxed">
                              <div className="mb-1.5 flex items-center justify-between border-b border-border-subtle pb-1.5">
                                <span className="font-mono text-[11px] font-medium text-primary">
                                  Supporting passage &bull; Page{' '}
                                  {entry.citations[activeCitation.citIdx]?.pageNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveCitation(null)}
                                  className="rounded-sm p-0.5 text-muted transition-colors hover:text-primary"
                                  aria-label="Close passage excerpt"
                                >
                                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                              </div>
                              <blockquote className="my-1 border-l-2 border-accent pl-2.5 font-sans text-xs italic leading-relaxed text-primary">
                                &ldquo;{entry.citations[activeCitation.citIdx]?.passage}&rdquo;
                              </blockquote>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* AI thinking indicator */}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border-subtle bg-subtle"
                aria-hidden="true"
              >
                <BookOpen className="h-3.5 w-3.5 stroke-[1.75] text-accent" />
              </div>
              <div className="flex items-center gap-2 rounded-xl rounded-tl-sm border border-border-subtle bg-surface px-4 py-3 shadow-xs">
                {[0, 1, 2].map((j) => (
                  <span
                    key={j}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                    style={{ animationDelay: `${j * 140}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Prompt input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="border-t border-border-subtle bg-surface p-3"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id="ask-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this document..."
                disabled={loading}
                className="w-full rounded-md border border-border-subtle bg-surface py-2 pl-3 pr-3 text-sm text-primary outline-none transition-colors placeholder:text-muted hover:border-primary/40 focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Type your question about this document"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !question.trim()}
              loading={loading}
              className="gap-1.5 shrink-0"
              aria-label="Send question"
            >
              {!loading && <Send className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />}
              <span>Ask</span>
            </Button>
          </div>

          {/* Quick suggestion chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
              Try:
            </span>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => ask(ex)}
                disabled={loading}
                className="cursor-pointer rounded-sm border border-border-subtle bg-subtle px-2 py-1 text-[11px] text-secondary transition-colors hover:border-primary/40 hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Accessible clear history confirmation modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => !clearing && setShowClearModal(false)}
        title="Clear ask history"
        description="This will permanently delete the saved question and answer history for this document. You will start with a fresh slate."
      >
        <div className="mt-5 flex justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowClearModal(false)}
            disabled={clearing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleClearHistory}
            loading={clearing}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear history</span>
          </Button>
        </div>
      </Modal>
    </div>
  );
}
