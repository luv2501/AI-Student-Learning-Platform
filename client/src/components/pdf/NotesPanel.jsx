import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Copy, Check, Download, RefreshCw } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';
import GeneratePrompt, { PanelShell, useAiPanel } from './GeneratePrompt.jsx';

/** Turns the structured notes into markdown for copy / download. */
function toMarkdown(notes, name) {
  const lines = [`# ${name.replace(/\.pdf$/i, '')}`, '', '## Summary', notes.summary, ''];

  if (notes.keyPoints?.length) {
    lines.push('## Key points', ...notes.keyPoints.map((p) => `- ${p}`), '');
  }
  notes.sections?.forEach((section) => {
    lines.push(`## ${section.heading}`, ...section.points.map((p) => `- ${p}`), '');
  });

  return lines.join('\n');
}

export default function NotesPanel({ document: doc, onGenerated }) {
  const { data, loading, error, run, setError } = useAiPanel(doc._id, 'notes', onGenerated);
  const notes = data ?? doc.notes;
  const [copied, setCopied] = useState(false);

  if (!notes) {
    return (
      <GeneratePrompt
        icon={FileText}
        title="Study notes"
        text="Turn this PDF into a short summary, the key points to remember, and section-by-section bullets."
        label="Generate notes"
        loading={loading}
        error={error}
        onDismissError={() => setError('')}
        onGenerate={run}
      />
    );
  }

  const docTitle = doc.title || doc.originalName || 'document';
  const markdown = toMarkdown(notes, docTitle);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success('Notes copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const msg = 'Your browser blocked copying. Try downloading instead.';
      setError(msg);
      toast.error(msg);
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${docTitle.replace(/\.pdf$/i, '')} notes.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Notes downloaded');
  }

  return (
    <PanelShell
      title="Study notes"
      subtitle={`${notes.keyPoints?.length || 0} key points · ${notes.sections?.length || 0} sections`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          <Button variant="secondary" size="xs" onClick={copy} className="gap-1">
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="secondary" size="xs" onClick={download} className="gap-1">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </Button>
          <Button variant="ghost" size="xs" onClick={() => run(true)} disabled={loading} className="gap-1">
            {loading ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            Regenerate
          </Button>
        </>
      }
    >
      <Card className="border-l-2 border-l-accent bg-surface">
        <p className="text-[11px] font-mono font-medium uppercase tracking-wider text-accent">Summary</p>
        <p className="mt-2 text-sm leading-relaxed text-secondary">{notes.summary}</p>
      </Card>

      {notes.keyPoints?.length > 0 && (
        <Card>
          <h3 className="font-medium tracking-tight text-primary text-sm">Key points to remember</h3>
          <ul className="mt-3 space-y-2.5">
            {notes.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-xs leading-relaxed text-secondary">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border border-border-subtle bg-subtle font-mono text-[11px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {notes.sections?.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.sections.map((section, i) => (
            <Card key={i} hover>
              <h3 className="font-medium tracking-tight text-primary text-sm">{section.heading}</h3>
              <ul className="mt-2.5 space-y-2">
                {section.points.map((point, j) => (
                  <li key={j} className="flex gap-2 text-xs leading-relaxed text-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-xs bg-muted" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
