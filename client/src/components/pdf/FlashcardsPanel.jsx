import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Layers,
  Shuffle,
  RotateCcw,
  RefreshCw,
  Check,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import GeneratePrompt, { PanelShell, useAiPanel } from './GeneratePrompt.jsx';

export default function FlashcardsPanel({ document: doc, onGenerated }) {
  const { data, loading, error, run, setError } = useAiPanel(doc._id, 'flashcards', onGenerated);
  const cards = data ?? (doc.flashcards?.length ? doc.flashcards : null);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState(null);
  // Self-marking lives in this session only — no backend change needed.
  const [known, setKnown] = useState({});

  const deck = useMemo(() => {
    if (!cards) return [];
    return order ? order.map((i) => cards[i]).filter(Boolean) : cards;
  }, [cards, order]);

  const move = useCallback(
    (step) => {
      setFlipped(false);
      setIndex((i) => (deck.length ? (i + step + deck.length) % deck.length : 0));
    },
    [deck.length]
  );

  const mark = useCallback(
    (value) => {
      setKnown((k) => {
        const next = { ...k, [index]: value };
        if (Object.keys(next).length === deck.length && deck.length > 0) {
          toast.success('Flashcard session complete! All cards reviewed.');
        }
        return next;
      });
      if (index < deck.length - 1) move(1);
    },
    [index, deck.length, move]
  );

  // Keyboard shortcuts: space flips, arrows navigate, 1/2 mark the card.
  useEffect(() => {
    if (!deck.length) return;

    function onKey(e) {
      if (e.target.matches('input, textarea, select')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === '1') mark(true);
      else if (e.key === '2') mark(false);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck.length, move, mark]);

  if (!cards) {
    return (
      <GeneratePrompt
        icon={Layers}
        title="Flashcards"
        text="Generate question and answer cards from this PDF, then flip through them to test your recall."
        label="Generate flashcards"
        loading={loading}
        error={error}
        onDismissError={() => setError('')}
        onGenerate={run}
      />
    );
  }

  const card = deck[Math.min(index, deck.length - 1)];
  const reviewed = Object.keys(known).length;
  const knownCount = Object.values(known).filter(Boolean).length;

  function shuffle() {
    const next = cards.map((_, i) => i);
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setIndex(0);
    setFlipped(false);
    setKnown({});
    toast.info('Deck shuffled');
  }

  function reset() {
    setOrder(null);
    setIndex(0);
    setFlipped(false);
    setKnown({});
    toast.info('Session reset');
  }

  return (
    <PanelShell
      title="Flashcards"
      subtitle={`${deck.length} cards · ${knownCount} marked as known`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          <Button variant="secondary" size="xs" onClick={shuffle} className="gap-1">
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            Shuffle
          </Button>
          {(order || reviewed > 0) && (
            <Button variant="ghost" size="xs" onClick={reset} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </Button>
          )}
          <Button variant="ghost" size="xs" onClick={() => run(true)} disabled={loading} className="gap-1">
            {loading ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            New set
          </Button>
        </>
      }
    >
      <ProgressBar value={(reviewed / deck.length) * 100} label="Session progress" />

      {/* Card — click or press space to flip */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full text-left"
        aria-label="Flip card"
      >
        <Card
          className={`min-h-56 cursor-pointer select-none transition-all duration-150 ${
            flipped ? 'border-accent/40 bg-accent-subtle/30' : 'hover:border-primary/30'
          }`}
        >
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-2 py-6 text-center">
            <Badge tone={flipped ? 'indigo' : 'slate'}>{flipped ? 'Answer' : 'Question'}</Badge>
            <p
              key={`${index}-${flipped}`}
              className="animate-fade-in max-w-xl text-base font-medium leading-relaxed text-primary sm:text-lg"
            >
              {flipped ? card.answer : card.question}
            </p>
            <p className="font-mono text-xs text-muted">
              Card {index + 1} of {deck.length} · space to flip
            </p>
          </div>
        </Card>
      </button>

      {/* Self marking */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => mark(true)}
          className={`gap-1.5 ${known[index] === true ? 'border-success/40 bg-success-subtle text-success' : ''}`}
        >
          <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span>I knew this</span>
          <span className="hidden font-mono text-[10px] text-muted sm:inline">(1)</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => mark(false)}
          className={`gap-1.5 ${known[index] === false ? 'border-warning/40 bg-warning-subtle text-warning' : ''}`}
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Review again</span>
          <span className="hidden font-mono text-[10px] text-muted sm:inline">(2)</span>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => move(-1)} className="gap-1">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <span className="font-mono text-xs text-muted">
          {reviewed === deck.length ? 'Deck complete' : `${deck.length - reviewed} left`}
        </span>
        <Button variant="ghost" size="sm" onClick={() => move(1)} className="gap-1">
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </PanelShell>
  );
}
