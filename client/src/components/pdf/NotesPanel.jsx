import { useState } from 'react';
import { toast } from 'sonner';
import { StickyNote, Copy, Check, Download, RefreshCw } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';
import GeneratePrompt, { PanelShell, useAiPanel } from './GeneratePrompt.jsx';

/** Turns the structured notes into markdown for copy / download. */
function toMarkdown(notes, name) {
  const lines = [`# ${name.replace(/\.pdf$/i, '')}`, '', '## Summary', notes.summary, ''];

  if (notes.keyPoints?.length) {
    lines.push('## Key Points', ...notes.keyPoints.map((p) => `- ${p}`), '');
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
        icon={StickyNote}
        title="Study Notes"
        text="Turn this document into a structured summary, key points to remember, and section-by-section concept breakdowns."
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
      const msg = 'Browser blocked clipboard access. Try downloading instead.';
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
    toast.success('Notes downloaded as Markdown');
  }

  const keyPointCount = notes.keyPoints?.length || 0;
  const sectionCount = notes.sections?.length || 0;

  return (
    <PanelShell
      title="Study Notes"
      subtitle={`${keyPointCount} key point${keyPointCount === 1 ? '' : 's'} · ${sectionCount} section${sectionCount === 1 ? '' : 's'}`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          <Button variant="secondary" size="xs" onClick={copy} className="gap-1.5">
            {copied ? (
              <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy notes'}
          </Button>
          <Button variant="secondary" size="xs" onClick={download} className="gap-1.5">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => run(true)}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <Spinner aria-hidden="true" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Regenerate
          </Button>
        </>
      }
    >
      {/* Summary callout */}
      <div className="rounded-xl border-l-4 border-l-accent border border-border-subtle bg-surface p-4">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
          Summary
        </p>
        <p className="mt-2 text-sm leading-relaxed text-secondary">{notes.summary}</p>
      </div>

      {/* Key points */}
      {notes.keyPoints?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold tracking-tight text-primary">Key Points</h3>
          <ul className="mt-3.5 space-y-2.5" role="list">
            {notes.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-secondary">
                <span
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border border-border-subtle bg-subtle font-mono text-[11px] font-semibold text-primary"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Section breakdowns */}
      {notes.sections?.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.sections.map((section, i) => (
            <Card key={i} hover>
              <h3 className="text-sm font-semibold tracking-tight text-primary">
                {section.heading}
              </h3>
              <ul className="mt-3 space-y-2" role="list">
                {section.points.map((point, j) => (
                  <li key={j} className="flex gap-2.5 text-xs leading-relaxed text-secondary">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border-subtle"
                      aria-hidden="true"
                    />
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
