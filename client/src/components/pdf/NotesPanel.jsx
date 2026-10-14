import { useState } from 'react';
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
        icon="📝"
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

  const markdown = toMarkdown(notes, doc.originalName);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Your browser blocked copying. Try the download instead.');
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${doc.originalName.replace(/\.pdf$/i, '')} notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PanelShell
      title="Study notes"
      subtitle={`${notes.keyPoints?.length || 0} key points · ${notes.sections?.length || 0} sections`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? '✓ Copied' : 'Copy'}
          </Button>
          <Button variant="secondary" size="sm" onClick={download}>
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={() => run(true)} disabled={loading}>
            {loading && <Spinner />}
            Regenerate
          </Button>
        </>
      }
    >
      <Card className="border-l-4 border-l-indigo-500">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Summary</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{notes.summary}</p>
      </Card>

      {notes.keyPoints?.length > 0 && (
        <Card>
          <h3 className="font-semibold tracking-tight text-slate-900">Key points to remember</h3>
          <ul className="mt-3 space-y-2.5">
            {notes.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-700">
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
              <h3 className="font-semibold tracking-tight text-slate-900">{section.heading}</h3>
              <ul className="mt-2.5 space-y-1.5">
                {section.points.map((point, j) => (
                  <li key={j} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    {point}
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
