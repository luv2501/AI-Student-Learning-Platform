import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Layers,
  Shuffle,
  RotateCcw,
  RefreshCw,
  Check,
  X,
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
  // Self-marking lives in this session only: no backend change needed.
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
          toast.success('Session complete', {
            description: `${Object.values(next).filter(Boolean).length} of ${deck.length} cards mastered.`,
          });
        }
        return next;
      });
      if (index < deck.length - 1) move(1);
    },
    [index, deck.length, move]
  );

  // Keyboard shortcuts: space flips, arrows navigate, 1 = mastered, 2 = review again
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
        text="Generate question-and-answer cards from this document, then test your active recall by flipping through each one."
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
  const masteredCount = Object.values(known).filter(Boolean).length;
  const sessionDone = reviewed === deck.length && deck.length > 0;

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
    toast.info('Deck shuffled', { description: 'Card order randomized for fresh recall practice.' });
  }

  function reset() {
    setOrder(null);
    setIndex(0);
    setFlipped(false);
    setKnown({});
    toast.info('Session reset', { description: 'All progress cleared. Starting from card 1.' });
  }

  const cardNumStr = String(index + 1).padStart(2, '0');
  const totalStr = String(deck.length).padStart(2, '0');

  return (
    <PanelShell
      title="Flashcards"
      subtitle={`${deck.length} card${deck.length === 1 ? '' : 's'} · ${masteredCount} mastered`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          <Button variant="secondary" size="xs" onClick={shuffle} className="gap-1.5">
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            Shuffle
          </Button>
          {(order || reviewed > 0) && (
            <Button variant="ghost" size="xs" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset session
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => run(true)}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? <Spinner aria-hidden="true" /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            New set
          </Button>
        </>
      }
    >
      {/* Session progress bar */}
      <ProgressBar value={(reviewed / deck.length) * 100} label="Session progress" />

      {/* Card flip area: click or press Space */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded-xl"
        aria-label={flipped ? 'Show question (Space to flip back)' : 'Reveal answer (Space to flip)'}
      >
        <Card
          className={`cursor-pointer select-none transition-all duration-150 ${
            flipped
              ? 'border-accent/50 bg-accent-subtle/20'
              : 'hover:border-primary/30 hover:shadow-xs'
          }`}
        >
          <div className="flex min-h-52 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
            {/* Side indicator */}
            <Badge tone={flipped ? 'indigo' : 'slate'}>
              {flipped ? 'Answer' : 'Question'}
            </Badge>

            {/* Card content */}
            <p
              key={`${index}-${flipped}`}
              className="animate-fade-in max-w-xl text-base font-medium leading-relaxed text-primary sm:text-lg"
            >
              {flipped ? card.answer : card.question}
            </p>

            {/* Geist Mono progress tracker */}
            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <span>
                Card{' '}
                <span className="font-semibold text-secondary">{cardNumStr}</span>
                {' / '}
                <span>{totalStr}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Space to flip</span>
            </div>
          </div>
        </Card>
      </button>

      {/* Self-grading triggers */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => mark(true)}
          className={`gap-2 ${
            known[index] === true
              ? 'border-success/50 bg-success-subtle text-success hover:bg-success-subtle'
              : ''
          }`}
          aria-pressed={known[index] === true}
        >
          <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span>Mastered</span>
          <span className="hidden font-mono text-[10px] text-muted sm:inline">(1)</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => mark(false)}
          className={`gap-2 ${
            known[index] === false
              ? 'border-warning/50 bg-warning-subtle text-warning hover:bg-warning-subtle'
              : ''
          }`}
          aria-pressed={known[index] === false}
        >
          <X className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span>Needs review</span>
          <span className="hidden font-mono text-[10px] text-muted sm:inline">(2)</span>
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => move(-1)} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <span className="font-mono text-xs text-muted">
          {sessionDone ? (
            <span className="text-success font-medium">Deck complete</span>
          ) : (
            `${deck.length - reviewed} card${deck.length - reviewed === 1 ? '' : 's'} remaining`
          )}
        </span>
        <Button variant="ghost" size="sm" onClick={() => move(1)} className="gap-1.5">
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </PanelShell>
  );
}
