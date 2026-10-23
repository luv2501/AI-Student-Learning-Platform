import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  X,
} from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api.js';
import {
  previewRatings,
  getCardState,
  RATING_LABELS,
} from '../../lib/sm2.js';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';

const RATING_CONFIG = [
  { rating: 1, label: 'Again', key: '1' },
  { rating: 2, label: 'Hard', key: '2' },
  { rating: 3, label: 'Good', key: '3' },
  { rating: 4, label: 'Easy', key: '4' },
];

export default function DueReviewModal({ isOpen, onClose, onSessionFinished }) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Fetch all due cards across all documents
  const loadDueCards = useCallback(async () => {
    setLoading(true);
    setIndex(0);
    setFlipped(false);
    setCompletedCount(0);
    try {
      const res = await api.get('/flashcards/due');
      setCards(res.data?.dueCards || []);
    } catch (err) {
      toast.error('Failed to load due flashcards', {
        description: apiErrorMessage(err),
      });
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDueCards();
    }
  }, [isOpen, loadDueCards]);

  const activeCard = cards[index];
  const cardState = getCardState(activeCard?.review);
  const previews = previewRatings(activeCard?.review);

  const move = useCallback(
    (step) => {
      setFlipped(false);
      setIndex((i) => (cards.length ? (i + step + cards.length) % cards.length : 0));
    },
    [cards.length]
  );

  const handleRate = useCallback(
    async (rating) => {
      if (!activeCard || submitting) return;
      setSubmitting(true);

      try {
        const res = await api.post('/flashcards/review', {
          documentId: activeCard.documentId,
          cardId: activeCard.cardId,
          rating,
        });

        const previewText = res.data?.previews?.[rating]?.text || '1d';
        const label = RATING_LABELS[rating] || 'Review';

        toast.success(`Marked as ${label}`, {
          description: `Next review in ${previewText}.`,
        });

        setCompletedCount((prev) => prev + 1);

        // Remove card from queue or advance
        setCards((prev) => prev.filter((_, i) => i !== index));
        setFlipped(false);

        if (index >= cards.length - 1) {
          setIndex(0);
        }
      } catch (err) {
        toast.error('Failed to log review', {
          description: apiErrorMessage(err),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [activeCard, submitting, index, cards.length]
  );

  // Keyboard navigation: Space to flip, 1-4 to rate when flipped
  useEffect(() => {
    if (!isOpen || !cards.length) return;

    function onKey(e) {
      if (e.target.matches('input, textarea, select')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        move(1);
      } else if (e.key === 'ArrowLeft') {
        move(-1);
      } else if (flipped && !submitting) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, cards.length, flipped, submitting, handleRate, move]);

  function handleClose() {
    if (completedCount > 0) {
      onSessionFinished?.();
    }
    onClose?.();
  }

  const totalRemaining = cards.length;
  const initialTotal = completedCount + totalRemaining;
  const progressPercent = initialTotal > 0 ? (completedCount / initialTotal) * 100 : 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-xl"
      className="p-6"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-subtle text-accent">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-primary">
                Daily Spaced Repetition Session
              </h3>
              <p className="font-mono text-xs text-muted">
                {totalRemaining > 0
                  ? `${totalRemaining} card${totalRemaining === 1 ? '' : 's'} remaining today`
                  : 'All due cards complete'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close review session"
            className="rounded-md p-1.5 text-muted hover:text-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-60 flex-col items-center justify-center gap-3 py-12">
            <Spinner aria-hidden="true" />
            <p className="font-mono text-xs text-muted">Collecting cards due for review...</p>
          </div>
        ) : totalRemaining === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success border border-success/30">
              <CheckCircle2 className="h-6 w-6 stroke-[2]" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-primary">
                Review Session Complete
              </h4>
              <p className="mt-1 max-w-sm text-xs text-secondary leading-relaxed">
                You have reviewed all due flashcards across your library. Your memory intervals have been recalculated with the SM-2 algorithm.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Session progress */}
            <ProgressBar value={progressPercent} label="Daily review progress" />

            {/* Document Context Chip */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted truncate max-w-[280px]">
                Source: <span className="text-secondary">{activeCard.documentTitle}</span>
              </span>
              <Link
                to={`/workspace/${activeCard.documentId}?tab=flashcards`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline"
              >
                <span>Open in workspace</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            {/* Flip Card Area */}
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded-xl"
              aria-label={flipped ? 'Show question (Space to flip)' : 'Reveal answer (Space to flip)'}
            >
              <Card
                className={`cursor-pointer select-none transition-all duration-150 ${
                  flipped
                    ? 'border-accent/50 bg-accent-subtle/20'
                    : 'hover:border-primary/30 hover:shadow-xs'
                }`}
              >
                <div className="flex min-h-52 flex-col items-center justify-center gap-4 px-4 py-6 text-center">
                  {/* Badges Header */}
                  <div className="flex items-center gap-2">
                    <Badge tone={flipped ? 'indigo' : 'slate'}>
                      {flipped ? 'Answer' : 'Question'}
                    </Badge>
                    <Badge tone={cardState.tone} className="font-mono text-[11px]">
                      {cardState.status}
                    </Badge>
                    {activeCard.repetition > 0 && (
                      <span className="font-mono text-xs text-muted">
                        · rep {activeCard.repetition}
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <p
                    key={`${activeCard.cardId}-${flipped}`}
                    className="animate-fade-in max-w-lg text-base font-medium leading-relaxed text-primary"
                  >
                    {flipped ? activeCard.answer : activeCard.question}
                  </p>

                  {/* Tracking footer */}
                  <div className="flex items-center gap-2 font-mono text-xs text-muted">
                    <span>
                      Card <span className="font-semibold text-secondary">{index + 1}</span> of{' '}
                      <span>{totalRemaining}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Space to flip</span>
                  </div>
                </div>
              </Card>
            </button>

            {/* Rating Controls */}
            {flipped ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-secondary px-0.5">
                  <span className="font-mono">Rate recall to schedule next review:</span>
                  <span className="font-mono text-muted hidden sm:inline">Keys 1 to 4</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {RATING_CONFIG.map(({ rating, label, key }) => {
                    const preview = previews[rating];
                    return (
                      <button
                        key={rating}
                        type="button"
                        disabled={submitting}
                        onClick={() => handleRate(rating)}
                        aria-label={`Rate ${label}, next review in ${preview?.text || '1d'}`}
                        className="group relative flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-center transition-all duration-150 hover:border-primary/40 hover:bg-subtle/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
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
                className="w-full py-2.5 text-secondary font-mono text-xs flex items-center justify-center gap-2"
              >
                <span>Reveal answer to rate recall</span>
                <span className="rounded border border-border-subtle bg-subtle px-1.5 py-0.5 text-[10px]">
                  Space
                </span>
              </Button>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button variant="ghost" size="xs" onClick={() => move(-1)} className="gap-1">
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Previous
              </Button>
              <span className="font-mono text-xs text-muted">
                {totalRemaining} card{totalRemaining === 1 ? '' : 's'} in queue
              </span>
              <Button variant="ghost" size="xs" onClick={() => move(1)} className="gap-1">
                Skip
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
