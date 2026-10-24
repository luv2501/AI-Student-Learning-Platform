import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  CheckCircle2,
  FileText,
  Flame,
} from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';

const MODES = [
  { key: 'pomodoro', label: 'Focus', minutes: 25 },
  { key: 'short_break', label: 'Short Break', minutes: 5 },
  { key: 'long_break', label: 'Long Break', minutes: 15 },
];

function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch {
    /* ignore audio policy errors */
  }
}

export default function FocusTimerModal({
  isOpen,
  onClose,
  documents = [],
  defaultDocumentId = null,
  currentStreak = 0,
  onSessionComplete,
}) {
  const [mode, setMode] = useState('pomodoro');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(defaultDocumentId || '');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [saving, setSaving] = useState(false);

  const originalTitleRef = useRef('');

  // Capture original title on open
  useEffect(() => {
    if (isOpen) {
      originalTitleRef.current = document.title;
    } else {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    }
  }, [isOpen]);

  // Keep selectedDocId synced if defaultDocumentId changes
  useEffect(() => {
    if (defaultDocumentId) {
      setSelectedDocId(defaultDocumentId);
    }
  }, [defaultDocumentId]);

  // Handle mode switches
  const switchMode = useCallback((newModeKey) => {
    const targetMode = MODES.find((m) => m.key === newModeKey) || MODES[0];
    setMode(targetMode.key);
    setDurationMinutes(targetMode.minutes);
    setTimeLeft(targetMode.minutes * 60);
    setIsRunning(false);
  }, []);

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Update document.title while modal is active or running
  useEffect(() => {
    if (!isOpen) return;

    const currentModeLabel = MODES.find((m) => m.key === mode)?.label || 'Focus';
    if (isRunning) {
      document.title = `(${timeFormatted}) ${currentModeLabel} · FileSense`;
    } else if (timeLeft < durationMinutes * 60) {
      document.title = `(Paused) ${currentModeLabel} · FileSense`;
    } else {
      document.title = originalTitleRef.current || 'FileSense';
    }

    return () => {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [isOpen, isRunning, timeFormatted, mode, timeLeft, durationMinutes]);

  // Complete session API call
  const handleSessionFinished = useCallback(async () => {
    setIsRunning(false);
    playNotificationChime();
    setSaving(true);

    const isFocus = mode === 'pomodoro';
    const nextCompleted = isFocus ? completedSessions + 1 : completedSessions;
    if (isFocus) {
      setCompletedSessions(nextCompleted);
    }

    try {
      const payload = {
        durationMinutes,
        type: mode,
        documentId: selectedDocId || undefined,
      };

      const res = await api.post('/timer/session', payload);
      const updatedStreak = res.data?.streak?.current ?? res.data?.streak?.streakCount ?? 1;

      if (isFocus) {
        toast.success(`Focus session completed! ${durationMinutes}m logged.`, {
          description: `Active study streak: ${updatedStreak} day${updatedStreak === 1 ? '' : 's'}.`,
        });
      } else {
        toast.info('Break finished! Ready to resume focus.');
      }

      onSessionComplete?.(res.data);

      // Advance to next logical mode
      if (isFocus) {
        if (nextCompleted % 4 === 0) {
          switchMode('long_break');
        } else {
          switchMode('short_break');
        }
      } else {
        switchMode('pomodoro');
      }
    } catch (err) {
      toast.error('Failed to record session: ' + apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [mode, durationMinutes, selectedDocId, completedSessions, onSessionComplete, switchMode]);

  // Main countdown timer interval
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleSessionFinished();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, handleSessionFinished]);

  const toggleRunning = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
  };

  const skipTimer = () => {
    setIsRunning(false);
    if (mode === 'pomodoro') {
      switchMode('short_break');
    } else {
      switchMode('pomodoro');
    }
  };

  // Circular progress calculations
  const totalSeconds = durationMinutes * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-md"
      className="text-center"
      ariaLabel="Focus Timer"
    >
      <div className="space-y-6">
        {/* Header / Mode Switcher */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-subtle text-accent border border-accent/25">
                <Timer className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold text-primary">Focus Timer</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
              <Flame className="h-3.5 w-3.5 fill-accent/20 stroke-accent" aria-hidden="true" />
              <span>{currentStreak}-day streak</span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg border border-border-subtle bg-subtle/50 p-1">
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => switchMode(m.key)}
                  className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-surface text-primary shadow-xs font-semibold'
                      : 'text-secondary hover:text-primary hover:bg-surface/50'
                  }`}
                >
                  {m.label} ({m.minutes}m)
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimal Circular Progress Track & Digital Readout */}
        <div className="relative flex flex-col items-center justify-center py-2">
          <svg
            className="h-56 w-56 -rotate-90 transform"
            viewBox="0 0 220 220"
            aria-hidden="true"
          >
            {/* Background ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-border-subtle/60"
            />
            {/* Active progress ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className={`transition-all duration-500 ease-linear ${
                mode === 'pomodoro' ? 'text-accent' : 'text-emerald-500'
              }`}
            />
          </svg>

          {/* Centered Readout & Mode Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-mono text-5xl font-semibold tracking-tight text-primary tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {timeFormatted}
            </span>
            <span className="mt-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              {MODES.find((m) => m.key === mode)?.label}
            </span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={resetTimer}
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={toggleRunning}
            disabled={saving}
            className="w-32 gap-2"
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current ml-0.5" aria-hidden="true" />
                <span>{timeLeft < totalSeconds ? 'Resume' : 'Start'}</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={skipTimer}
            title="Skip to next mode"
            aria-label="Skip to next mode"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Optional Document Attachment Selector */}
        {documents && documents.length > 0 && (
          <div className="border-t border-border-subtle pt-4 text-left">
            <label
              htmlFor="timer-doc-select"
              className="flex items-center gap-1.5 text-xs font-medium text-secondary"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Link to document (optional)</span>
            </label>
            <select
              id="timer-doc-select"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs text-primary shadow-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">General Focus (No document)</option>
              {documents.map((doc) => (
                <option key={doc._id || doc.id} value={doc._id || doc.id}>
                  {doc.title || doc.originalName || 'Untitled Document'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Completed Cycles Counter */}
        <div className="flex items-center justify-between text-xs text-muted pt-1">
          <span>Completed focus blocks</span>
          <span className="font-mono font-medium text-primary">{completedSessions}</span>
        </div>
      </div>
    </Modal>
  );
}
