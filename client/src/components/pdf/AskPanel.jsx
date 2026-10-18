import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Send, BookOpen } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api.js';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import Spinner from '../ui/Spinner.jsx';
import EmptyState from '../ui/EmptyState.jsx';

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
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

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
      const { data } = await api.post(`/documents/${doc._id}/ask`, { question: asked });
      setThread((t) => [...t, { question: data.question, answer: data.answer }]);
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

  const docTitle = doc.title || doc.originalName;

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="border-b border-border-subtle pb-4">
        <h2 className="text-base font-semibold tracking-tight text-primary">Ask this document</h2>
        <p className="mt-0.5 text-xs text-secondary">
          All answers are grounded strictly in{' '}
          <span className="font-semibold text-primary">{docTitle}</span>.
        </p>
      </div>

      {error && (
        <Alert type="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Threaded conversation area */}
      <Card padding="none" className="overflow-hidden">
        <div className="sm-scroll max-h-[28rem] space-y-5 overflow-y-auto p-4 sm:p-5">
          {thread.length === 0 && !loading ? (
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
                <div className="flex justify-end" aria-label="Your question">
                  <p className="max-w-[85%] rounded-xl rounded-br-sm bg-accent px-4 py-2.5 text-sm leading-relaxed text-accent-contrast shadow-xs">
                    {entry.question}
                  </p>
                </div>

                {/* AI answer: left-aligned */}
                <div className="flex items-start gap-2.5" aria-label="AI answer">
                  {/* AI avatar chip */}
                  <div
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border-subtle bg-subtle"
                    aria-hidden="true"
                  >
                    <BookOpen className="h-3.5 w-3.5 stroke-[1.75] text-accent" />
                  </div>

                  <div className="max-w-[85%] space-y-2">
                    {/* Grounded-in-document citation chip */}
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-xs border border-border-subtle bg-subtle px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted">
                        {docTitle.replace(/\.pdf$/i, '')}
                      </span>
                    </div>

                    {/* Answer bubble */}
                    <div className="whitespace-pre-line rounded-xl rounded-tl-sm border border-border-subtle bg-surface px-4 py-3 text-sm leading-relaxed text-secondary shadow-xs">
                      {entry.answer}
                    </div>
                  </div>
                </div>
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
    </div>
  );
}
