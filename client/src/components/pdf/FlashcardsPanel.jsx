import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Layers,
  Shuffle,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api.js';
import {
  previewRatings,
  getCardState,
  getCardId,
  RATING_LABELS,
} from '../../lib/sm2.js';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import GeneratePrompt, { PanelShell, useAiPanel } from './GeneratePrompt.jsx';

const RATING_CONFIG = [
  { rating: 1, label: 'Again', key: '1', tone: 'rose' },
  { rating: 2, label: 'Hard', key: '2', tone: 'amber' },
  { rating: 3, label: 'Good', key: '3', tone: 'indigo' },
  { rating: 4, label: 'Easy', key: '4', tone: 'emerald' },
];

export default function FlashcardsPanel({ document: doc, onGenerated }) {
  const { data, loading, error, run, setError } = useAiPanel(doc._id, 'flashcards', onGenerated);
  const rawCards = data ?? (doc.flashcards?.length ? doc.flashcards : null);

  const [reviews, setReviews] = useState({});
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState(null);
  const [onlyDue, setOnlyDue] = useState(false);
  const [sessionReviewed, setSessionReviewed] = useState({});
  const [submittingRating, setSubmittingRating] = useState(false);

  // Normalize cards with guaranteed cardId
  const cards = useMemo(() => {
    if (!rawCards) return null;
    return rawCards.map((c) => ({
      ...c,
      cardId: c.cardId || getCardId(c),
    }));
  }, [rawCards]);

  // Fetch persistent SM-2 review states for this document
  const fetchReviews = useCallback(async () => {
    if (!doc?._id || !cards?.length) return;
    try {
      const res = await api.get(`/documents/${doc._id}/flashcards/reviews`);
      if (res.data?.reviewsByCardId) {
        setReviews(res.data.reviewsByCardId);
      }
    } catch {
      // Non-fatal: review states will default to 'New'
    }
  }, [doc?._id, cards?.length]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Active deck calculation (respecting shuffle order and due-only filter)
  const deck = useMemo(() => {
    if (!cards) return [];
    let base = cards;
    if (onlyDue) {
      const now = new Date();
      base = cards.filter((c) => {
        const rev = reviews[c.cardId];
        if (!rev || !rev.lastReviewed) return true; // New cards are due
        return new Date(rev.dueDate).getTime() <= now.getTime();
      });
    }
    if (order && !onlyDue) {
      return order.map((i) => cards[i]).filter(Boolean);
    }
    return base;
  }, [cards, reviews, onlyDue, order]);

  // Keep index within bounds whenever deck changes
  useEffect(() => {
    if (index >= deck.length && deck.length > 0) {
      setIndex(0);
    }
  }, [deck.length, index]);

  const move = useCallback(
    (step) => {
      setFlipped(false);
      setIndex((i) => (deck.length ? (i + step + deck.length) % deck.length : 0));
    },
    [deck.length]
  );

  const activeCard = deck[Math.min(index, Math.max(0, deck.length - 1))];
  const activeCardId = activeCard?.cardId;
  const currentReview = activeCardId ? reviews[activeCardId] : null;
  const cardState = getCardState(currentReview);
  const previews = previewRatings(currentReview);

  // Handle SM-2 rating submission (1: Again, 2: Hard, 3: Good, 4: Easy)
  const handleRate = useCallback(
    async (rating) => {
      if (!activeCard || submittingRating) return;
      const cid = activeCard.cardId;
      setSubmittingRating(true);

      try {
        const res = await api.post('/flashcards/review', {
          documentId: doc._id,
          cardId: cid,
          rating,
        });

        const updatedReview = res.data.review;
        setReviews((prev) => ({
          ...prev,
          [cid]: updatedReview,
        }));

        setSessionReviewed((prev) => ({
          ...prev,
          [cid]: rating,
        }));

        const previewText = res.data.previews?.[rating]?.text || '1d';
        const ratingLabel = RATING_LABELS[rating] || 'Review';

        toast.success(`Marked as ${ratingLabel}`, {
          description: `Next review scheduled in ${previewText}.`,
        });

        // Advance to next card
        setFlipped(false);
        setIndex((i) => (deck.length ? (i + 1) % deck.length : 0));
      } catch (err) {
        toast.error('Failed to log review', {
          description: apiErrorMessage(err),
        });
      } finally {
        setSubmittingRating(false);
      }
    },
    [activeCard, submittingRating, doc._id, deck.length]
  );

  // Keyboard navigation: Space to flip, 1-4 to rate when flipped, arrows to navigate
  useEffect(() => {
    if (!deck.length) return;

    function onKey(e) {
      if (e.target.matches('input, textarea, select')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        move(1);
      } else if (e.key === 'ArrowLeft') {
        move(-1);
      } else if (flipped && !submittingRating) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck.length, flipped, submittingRating, handleRate, move]);

  if (!cards) {
    return (
      <GeneratePrompt
        icon={Layers}
        title="Flashcards"
        text="Generate question-and-answer cards from this document, then test your active recall with the SM-2 spaced repetition scheduler."
        label="Generate flashcards"
        loading={loading}
        error={error}
        onDismissError={() => setError('')}
        onGenerate={run}
      />
    );
  }

  // Calculate deck metrics
  const now = new Date();
  const dueCount = cards.filter((c) => {
    const rev = reviews[c.cardId];
    if (!rev || !rev.lastReviewed) return true;
    return new Date(rev.dueDate).getTime() <= now.getTime();
  }).length;

  const sessionReviewedCount = Object.keys(sessionReviewed).length;
  const sessionComplete = sessionReviewedCount >= deck.length && deck.length > 0;

  function shuffle() {
    const next = cards.map((_, i) => i);
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setIndex(0);
    setFlipped(false);
    toast.info('Deck shuffled', {
      description: 'Card order randomized for fresh recall practice.',
    });
  }

  function resetSession() {
    setOrder(null);
    setIndex(0);
    setFlipped(false);
    setSessionReviewed({});
    toast.info('Session reset', {
      description: 'Starting from the first card in the deck.',
    });
  }

  const cardNumStr = String(deck.length ? index + 1 : 0).padStart(2, '0');
  const totalStr = String(deck.length).padStart(2, '0');

  return (
    <PanelShell
      title="Flashcards"
      subtitle={`${cards.length} cards · ${dueCount} due for review · ${sessionReviewedCount} reviewed this session`}
      error={error}
      onDismissError={() => setError('')}
      actions={
        <>
          {dueCount > 0 && (
            <Button
              variant={onlyDue ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => {
                setOnlyDue((prev) => !prev);
                setIndex(0);
                setFlipped(false);
              }}
              className="gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{onlyDue ? 'Show all' : `Due only (${dueCount})`}</span>
            </Button>
          )}
          <Button variant="secondary" size="xs" onClick={shuffle} className="gap-1.5">
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            Shuffle
          </Button>
          {(order || sessionReviewedCount > 0) && (
            <Button variant="ghost" size="xs" onClick={resetSession} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
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
      <ProgressBar
        value={deck.length ? (sessionReviewedCount / deck.length) * 100 : 0}
        label="Session review progress"
      />

      {deck.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Badge tone="emerald">All caught up</Badge>
            <p className="text-sm text-secondary">
              No flashcards are currently due for spaced repetition review in this document.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setOnlyDue(false)}>
              Review all cards anyway
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Card flip area */}
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
              <div className="flex min-h-56 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
                {/* Status Badges Header */}
                <div className="flex items-center gap-2">
                  <Badge tone={flipped ? 'indigo' : 'slate'}>
                    {flipped ? 'Answer' : 'Question'}
                  </Badge>
                  <Badge tone={cardState.tone} className="font-mono text-[11px]">
                    {cardState.status}
                  </Badge>
                  {currentReview?.repetition > 0 && (
                    <span className="font-mono text-xs text-muted">
                      · rep {currentReview.repetition} ({currentReview.interval}d)
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <p
                  key={`${index}-${flipped}`}
                  className="animate-fade-in max-w-xl text-base font-medium leading-relaxed text-primary sm:text-lg"
                >
                  {flipped ? activeCard.answer : activeCard.question}
                </p>

                {/* Progress & Flip Hint */}
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

          {/* SM-2 Rating Controls */}
          {flipped ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-secondary px-0.5">
                <span className="font-mono">Rate recall to schedule next review:</span>
                <span className="font-mono text-muted hidden sm:inline">Keys 1 to 4</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATING_CONFIG.map(({ rating, label, key, tone }) => {
                  const preview = previews[rating];
                  return (
                    <button
                      key={rating}
                      type="button"
                      disabled={submittingRating}
                      onClick={() => handleRate(rating)}
                      aria-label={`Rate ${label}, next review in ${preview?.text || '1d'}`}
                      className="group relative flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border-subtle bg-surface px-3 py-3 text-center transition-all duration-150 hover:border-primary/40 hover:bg-subtle/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                    >
                      <span className="font-mono text-xs font-semibold text-secondary group-hover:text-primary">
                        {preview?.text || '1d'}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {label}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        ({key})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setFlipped(true)}
              className="w-full py-3 text-secondary font-mono text-xs flex items-center justify-center gap-2"
            >
              <span>Reveal answer to rate recall</span>
              <span className="rounded border border-border-subtle bg-subtle px-1.5 py-0.5 text-[10px]">
                Space
              </span>
            </Button>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => move(-1)} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <span className="font-mono text-xs text-muted">
              {sessionComplete ? (
                <span className="text-success font-medium">Session complete</span>
              ) : (
                `${deck.length - sessionReviewedCount} remaining`
              )}
            </span>
            <Button variant="ghost" size="sm" onClick={() => move(1)} className="gap-1.5">
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </>
      )}
    </PanelShell>
  );
}
