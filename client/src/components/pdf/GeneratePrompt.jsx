import { isValidElement, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
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
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    try {
      const res = await api.post(
        `/documents/${documentId}/${field}${refresh ? '?refresh=true' : ''}`
      );
      setData(res.data[field]);
      onGenerated?.(field, res.data[field]);
      toast.success(`${fieldName} generated`, {
        description: `AI ${fieldName.toLowerCase()} for this document are ready.`,
      });
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, run, setError };
}

/**
 * Consistent panel shell: section header, optional action buttons, and error slot.
 * All panels render inside this wrapper for consistent spacing and typography.
 */
export function PanelShell({ title, subtitle, actions, error, onDismissError, children }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-primary">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 font-mono text-xs text-muted">{subtitle}</p>
          )}
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

/** First-run state: explain the panel tool, then trigger AI generation. */
export default function GeneratePrompt({ icon, title, text, label, loading, onGenerate, error, onDismissError }) {
  if (loading) {
    return (
      <Card>
        <ThinkingState label={`Building your ${title.toLowerCase()}`} />
      </Card>
    );
  }

  const renderIcon = () => {
    if (isValidElement(icon)) return icon;
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className="h-6 w-6 text-accent" aria-hidden="true" />;
    }
    return <Sparkles className="h-6 w-6 text-accent" aria-hidden="true" />;
  };

  return (
    <Card>
      <div className="flex flex-col items-center px-4 py-6 text-center sm:px-8 sm:py-10">
        <div className="grid h-14 w-14 place-items-center rounded-xl border border-border-subtle bg-subtle text-accent">
          {renderIcon()}
        </div>
        <h2 className="mt-4 text-base font-semibold tracking-tight text-primary">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-secondary">{text}</p>

        {error && (
          <div className="mt-4 w-full max-w-md">
            <Alert type="error" onDismiss={onDismissError}>
              {error}
            </Alert>
          </div>
        )}

        <Button className="mt-6 gap-2" onClick={() => onGenerate()} disabled={loading}>
          <Sparkles className="h-4 w-4 stroke-[1.75]" aria-hidden="true" />
          {label}
        </Button>
      </div>
    </Card>
  );
}
