import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { StickyNote, Copy, Check, Download, RefreshCw, Square } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import GeneratePrompt, { PanelShell } from './GeneratePrompt.jsx';
import { useAiStream } from '../../hooks/useAiStream.js';

/** Turns the structured notes into markdown for copy / download. */
function toMarkdown(notes, name) {
  if (!notes) return '';
  const lines = [`# ${name.replace(/\.pdf$/i, '')}`, '', '## Summary', notes.summary || '', ''];

  if (notes.keyPoints?.length) {
    lines.push('## Key Points', ...notes.keyPoints.map((p) => `- ${p}`), '');
  }
  notes.sections?.forEach((section) => {
    lines.push(`## ${section.heading}`, ...section.points.map((p) => `- ${p}`), '');
  });

  return lines.join('\n');
}

export default function NotesPanel({ document: doc, onGenerated }) {
  const [notes, setNotes] = useState(doc?.notes || null);
  const [copied, setCopied] = useState(false);
  const { isStreaming, streamedText, error, startStream, stopStream, setError } = useAiStream();

  const scrollRef = useRef(null);

  // Sync with document prop changes
  useEffect(() => {
    if (doc?.notes) {
      setNotes(doc.notes);
    }
  }, [doc?.notes]);

  // Smooth auto-scroll when new tokens arrive if user is near bottom
  useEffect(() => {
    if (!isStreaming || !scrollRef.current) return;
    const el = scrollRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [streamedText, isStreaming]);

  async function handleGenerate(refresh = false) {
    setError(null);
    try {
      await startStream(`/documents/${doc._id}/notes/stream?refresh=${refresh ? 'true' : 'false'}`, {
        method: 'GET',
        onDone: (payload) => {
          if (payload?.notes) {
            setNotes(payload.notes);
            onGenerated?.('notes', payload.notes);
            toast.success('Notes generated', {
              description: 'AI study notes for this document are ready.',
            });
          }
        },
        onError: (err) => {
          const msg = err?.message || 'Failed to generate notes';
          toast.error(msg);
        },
      });
    } catch {
      // Errors handled via onError
    }
  }

  function handleStop() {
    stopStream();
    toast.info('Generation stopped');
  }

  const docTitle = doc.title || doc.originalName || 'document';

  // First-run state: prompt user to start generation
  if (!notes && !isStreaming) {
    return (
      <GeneratePrompt
        icon={StickyNote}
        title="Study Notes"
        text="Turn this document into a structured summary, key points to remember, and section-by-section concept breakdowns."
        label="Generate notes"
        loading={false}
        error={error}
        onDismissError={() => setError('')}
        onGenerate={() => handleGenerate(false)}
      />
    );
  }

  // Active streaming state without existing notes
  if (isStreaming && !notes) {
    return (
      <PanelShell
        title="Study Notes"
        subtitle="Streaming live output from document"
        error={error}
        onDismissError={() => setError('')}
        actions={
          <Button
            variant="secondary"
            size="xs"
            onClick={handleStop}
            className="gap-1.5 text-danger border-danger/30 hover:bg-danger/10"
            aria-label="Stop generating notes"
          >
            <Square className="h-3 w-3 fill-current" aria-hidden="true" />
            <span>Stop generating</span>
          </Button>
        }
      >
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle bg-subtle/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="font-mono text-xs font-medium text-secondary">
                Generating notes...
              </span>
            </div>
            <span className="font-mono text-[11px] text-muted">
              {streamedText.length} characters
            </span>
          </div>
          <div
            ref={scrollRef}
            className="sm-scroll max-h-[30rem] overflow-y-auto p-4 sm:p-5 font-sans text-sm leading-relaxed text-secondary whitespace-pre-wrap selection:bg-accent/20"
          >
            {streamedText || 'Connecting to AI stream...'}
            <span
              className="inline-block h-4 w-1.5 ml-1 translate-y-0.5 bg-accent animate-pulse"
              aria-hidden="true"
            />
          </div>
        </Card>
      </PanelShell>
    );
  }

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

  const keyPointCount = notes?.keyPoints?.length || 0;
  const sectionCount = notes?.sections?.length || 0;

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
          {isStreaming ? (
            <Button
              variant="secondary"
              size="xs"
              onClick={handleStop}
              className="gap-1.5 text-danger border-danger/30 hover:bg-danger/10"
              aria-label="Stop generating notes"
            >
              <Square className="h-3 w-3 fill-current" aria-hidden="true" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleGenerate(true)}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Regenerate
            </Button>
          )}
        </>
      }
    >
      {/* Live token stream preview banner during regeneration */}
      {isStreaming && (
        <Card className="mb-4 overflow-hidden border-accent/40 bg-accent/5">
          <div className="flex items-center justify-between border-b border-border-subtle bg-subtle/50 px-3 py-1.5">
            <span className="font-mono text-xs text-accent">Regenerating in background...</span>
            <span className="font-mono text-[11px] text-muted">
              {streamedText.length} characters
            </span>
          </div>
          <div
            ref={scrollRef}
            className="sm-scroll max-h-48 overflow-y-auto p-3 text-xs leading-relaxed text-secondary whitespace-pre-wrap font-sans"
          >
            {streamedText || 'Connecting...'}
            <span
              className="inline-block h-3.5 w-1 ml-0.5 translate-y-0.5 bg-accent animate-pulse"
              aria-hidden="true"
            />
          </div>
        </Card>
      )}

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
