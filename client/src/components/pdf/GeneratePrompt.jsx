import { useState } from 'react';
import api, { apiErrorMessage } from '../../lib/api.js';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import Spinner, { ThinkingState } from '../ui/Spinner.jsx';

/**
 * Shared "generate with AI" state for the notes / flashcards / quiz panels.
 * onGenerated lets the workspace header update its badges.
 */
export function useAiPanel(documentId, field, onGenerated) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run(refresh = false) {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(
        `/documents/${documentId}/${field}${refresh ? '?refresh=true' : ''}`
      );
      setData(res.data[field]);
      onGenerated?.(field, res.data[field]);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, run, setError };
}

/** Consistent panel shell: title, optional actions, error slot. */
export function PanelShell({ title, subtitle, actions, error, onDismissError, children }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <Alert type="error" onDismiss={onDismissError}>
        {error}
      </Alert>

      {children}
    </div>
  );
}

/** First-run state: explain the tool, then generate it. */
export default function GeneratePrompt({ icon, title, text, label, loading, onGenerate, error, onDismissError }) {
  if (loading) {
    return (
      <Card>
        <ThinkingState label={`Building your ${title.toLowerCase()}`} />
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-2xl">
        {icon}
      </div>
      <h2 className="mt-4 font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{text}</p>

      <Alert type="error" className="mt-4 text-left" onDismiss={onDismissError}>
        {error}
      </Alert>

      <Button className="mt-5" onClick={() => onGenerate()} disabled={loading}>
        {loading && <Spinner />}
        {label}
      </Button>
    </Card>
  );
}
