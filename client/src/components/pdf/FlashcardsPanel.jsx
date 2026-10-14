import { useCallback, useEffect, useMemo, useState } from 'react';
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
      setKnown((k) => ({ ...k, [index]: value }));
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
        icon="🃏"
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
  }

  function reset() {
    setOrder(null);
    setIndex(0);
    setFlipped(false);
    setKnown({});
  }

  return (
    <PanelShell
      title="Flashcards"
      subtitle={`${deck.length} cards · ${knownCount} marked as known`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={shuffle}>
            Shuffle
          </Button>
          {(order || reviewed > 0) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Reset
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => run(true)} disabled={loading}>
            {loading && <Spinner />}
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
          className={`min-h-56 cursor-pointer select-none transition-all duration-200 ${
            flipped ? 'border-indigo-200 bg-indigo-50/40' : 'hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-2 py-6 text-center">
            <Badge tone={flipped ? 'indigo' : 'slate'}>{flipped ? 'Answer' : 'Question'}</Badge>
            <p
              key={`${index}-${flipped}`}
              className="animate-fade-in max-w-xl text-lg font-medium leading-relaxed text-slate-900"
            >
              {flipped ? card.answer : card.question}
            </p>
            <p className="text-xs text-slate-400">
              Card {index + 1} of {deck.length} · click or press space to flip
            </p>
          </div>
        </Card>
      </button>

      {/* Self marking */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => mark(true)}
          className={known[index] === true ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : ''}
        >
          ✓ I knew this <span className="hidden text-xs text-slate-400 sm:inline">(1)</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => mark(false)}
          className={known[index] === false ? 'border-amber-300 bg-amber-50 text-amber-700' : ''}
        >
          ↻ Review again <span className="hidden text-xs text-slate-400 sm:inline">(2)</span>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => move(-1)}>
          ← Previous
        </Button>
        <span className="text-xs text-slate-400">
          {reviewed === deck.length ? 'Deck complete' : `${deck.length - reviewed} left`}
        </span>
        <Button variant="ghost" onClick={() => move(1)}>
          Next →
        </Button>
      </div>
    </PanelShell>
  );
}
