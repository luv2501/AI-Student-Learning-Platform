import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api.js';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [thread, loading]);

  async function ask(text) {
    const asked = (text ?? question).trim();
    if (asked.length < 3) {
      setError('Please type a longer question');
      toast.error('Question too short');
      return;
    }

    setLoading(true);
    setError('');
    setQuestion('');
    try {
      const { data } = await api.post(`/documents/${doc._id}/ask`, { question: asked });
      setThread((t) => [...t, { question: data.question, answer: data.answer }]);
      toast.success('Response ready');
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
      setQuestion(asked);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-medium tracking-tight text-primary text-base">Ask this PDF</h2>
        <p className="mt-0.5 text-xs text-secondary">
          Answers come strictly from <b className="text-primary font-semibold">{doc.title || doc.originalName}</b>.
        </p>
      </div>

      <Alert type="error" onDismiss={() => setError('')}>
        {error}
      </Alert>

      {/* Conversation */}
      <Card padding="none" className="overflow-hidden">
        <div className="sm-scroll max-h-[26rem] space-y-4 overflow-y-auto p-4 sm:p-5">
          {thread.length === 0 && !loading ? (
            <EmptyState
              icon={<MessageSquare className="h-6 w-6 text-muted" aria-hidden="true" />}
              title="Ask anything about this document"
              text="Try one of the suggestions below, or type your own question."
              className="py-8"
            />
          ) : (
            thread.map((entry, i) => (
              <div key={i} className="animate-rise space-y-2.5">
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-md bg-accent px-3.5 py-2 text-xs leading-relaxed text-accent-contrast shadow-xs">
                    {entry.question}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-border-subtle bg-subtle font-mono text-[10px] font-bold text-accent">
                    AI
                  </span>
                  <div className="max-w-[85%] whitespace-pre-line rounded-md border border-border-subtle bg-surface px-3.5 py-2.5 text-xs leading-relaxed text-secondary shadow-xs">
                    {entry.answer}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-muted">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-border-subtle bg-subtle font-mono text-[10px] font-bold text-accent">
                AI
              </span>
              <span className="flex gap-1 rounded-md border border-border-subtle bg-subtle px-3 py-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                    style={{ animationDelay: `${i * 140}ms` }}
                  />
                ))}
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="border-t border-border-subtle bg-surface p-3"
        >
          <div className="flex gap-2">
            <Input
              id="ask-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this document..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !question.trim()} className="gap-1.5">
              {loading ? <Spinner /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
              Ask
            </Button>
          </div>

          {/* Quick suggestions */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Try:</span>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => ask(ex)}
                disabled={loading}
                className="cursor-pointer rounded-sm border border-border-subtle bg-subtle px-2 py-0.5 text-[11px] text-secondary transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
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
