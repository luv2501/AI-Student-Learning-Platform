import { useEffect, useRef, useState } from 'react';
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
    if (asked.length < 3) return setError('Please type a longer question');

    setLoading(true);
    setError('');
    setQuestion('');
    try {
      const { data } = await api.post(`/documents/${doc._id}/ask`, { question: asked });
      setThread((t) => [...t, { question: data.question, answer: data.answer }]);
    } catch (err) {
      setError(apiErrorMessage(err));
      setQuestion(asked);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold tracking-tight text-slate-900">Ask this PDF</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Answers come only from <b className="text-slate-700">{doc.title || doc.originalName}</b>, so they stay on
          topic.
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
              icon="💬"
              title="Ask anything about this document"
              text="Try one of the suggestions below, or type your own question."
              className="py-8"
            />
          ) : (
            thread.map((entry, i) => (
              <div key={i} className="animate-rise space-y-2.5">
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-3.5 py-2.5 text-sm text-white shadow-sm">
                    {entry.question}
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                    AI
                  </span>
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700">
                    {entry.answer}
                  </p>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                AI
              </span>
              <span className="flex gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: `${i * 140}ms` }}
                  />
                ))}
              </span>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="border-t border-slate-100 bg-white p-3 sm:p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="question"
              className="flex-1"
              placeholder="What does the Calvin cycle produce?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || question.trim().length < 3}>
              {loading && <Spinner />}
              {loading ? 'Thinking' : 'Ask'}
            </Button>
          </div>

          {thread.length === 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => ask(example)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
