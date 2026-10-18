import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Trash2,
  FileText,
  UploadCloud,
  AlertTriangle,
  StickyNote,
  Layers,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import SegmentedTabs from '../components/ui/SegmentedTabs.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { SkeletonWorkspace } from '../components/ui/Skeleton.jsx';
import NotesPanel from '../components/pdf/NotesPanel.jsx';
import FlashcardsPanel from '../components/pdf/FlashcardsPanel.jsx';
import QuizPanel from '../components/pdf/QuizPanel.jsx';
import AskPanel from '../components/pdf/AskPanel.jsx';

const PANEL_ICONS = {
  notes: StickyNote,
  flashcards: Layers,
  quiz: HelpCircle,
  ask: MessageSquare,
};

const tabs = [
  { key: 'notes', label: 'Notes', Panel: NotesPanel },
  { key: 'flashcards', label: 'Flashcards', Panel: FlashcardsPanel },
  { key: 'quiz', label: 'Quiz', Panel: QuizPanel },
  { key: 'ask', label: 'Ask', Panel: AskPanel },
];

const tabKeys = tabs.map((t) => t.key);

export default function StudyWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [doc, setDoc] = useState(null);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissedTruncation, setDismissedTruncation] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const requested = params.get('tab');
  const tab = tabKeys.includes(requested) ? requested : 'notes';

  const setTab = (key) => setParams({ tab: key }, { replace: true });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDoc(null);

    Promise.all([api.get(`/documents/${id}`), api.get('/documents')])
      .then(([docRes, listRes]) => {
        if (!active) return;
        setDoc(docRes.data.document);
        setLibrary(listRes.data.documents);
        setError('');
      })
      .catch((err) => {
        if (active) {
          const msg = apiErrorMessage(err);
          setError(msg);
          toast.error(msg);
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  // Close delete modal on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && showDeleteModal && !deleting) setShowDeleteModal(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDeleteModal, deleting]);

  /** Keeps the header badges in sync when a panel generates something. */
  function handleGenerated(field, value) {
    setDoc((current) => (current ? { ...current, [field]: value } : current));
    setLibrary((list) =>
      list.map((item) =>
        item._id === id
          ? {
              ...item,
              hasNotes: field === 'notes' ? true : item.hasNotes,
              hasFlashcards: field === 'flashcards' ? true : item.hasFlashcards,
              hasQuiz: field === 'quiz' ? true : item.hasQuiz,
            }
          : item
      )
    );
  }

  async function handleConfirmDelete() {
    if (!doc) return;
    const name = doc.title || doc.originalName;
    setDeleting(true);
    try {
      await api.delete(`/documents/${doc._id}`);
      toast.success(`"${name}" deleted`, { description: 'Document and study materials removed.' });
      navigate('/documents');
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <SkeletonWorkspace />;

  if (!doc) {
    return (
      <Card>
        <EmptyState
          icon={<FileText className="h-6 w-6 text-muted" aria-hidden="true" />}
          title="Document unavailable"
          text={error || 'This document could not be found in your library.'}
          action={
            <Link to="/documents">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to Library
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const ActivePanel = tabs.find((t) => t.key === tab).Panel;
  const others = library.filter((item) => item._id !== id);
  const docTitle = doc.title || doc.originalName || '';

  const ready = [
    (doc.hasNotes || Boolean(doc.notes)) && 'notes',
    (doc.hasFlashcards || (Array.isArray(doc.flashcards) && doc.flashcards.length > 0)) && 'flashcards',
    (doc.hasQuiz || (Array.isArray(doc.quiz) && doc.quiz.length > 0)) && 'quiz',
  ].filter(Boolean);

  const tabItems = tabs.map((t) => ({
    key: t.key,
    label: t.label,
    badge:
      (t.key === 'flashcards' && doc.flashcards?.length) ||
      (t.key === 'quiz' && doc.quiz?.length) ||
      undefined,
  }));

  return (
    <div className="space-y-5">
      {/* Workspace Header */}
      <div className="border-b border-border-subtle pb-5">
        {/* Breadcrumb row */}
        <div className="flex items-center justify-between">
          <Link
            to="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Document Library
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger"
            aria-label={`Delete ${docTitle}`}
          >
            <Trash2 className="h-3.5 w-3.5 stroke-[1.75]" aria-hidden="true" />
            <span className="hidden sm:inline">Delete document</span>
          </button>
        </div>

        {/* Title & metadata */}
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {docTitle.replace(/\.pdf$/i, '')}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
              <span>{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
              <span aria-hidden="true">·</span>
              <span>{doc.textLength?.toLocaleString()} characters indexed</span>
              <span aria-hidden="true">·</span>
              <span>
                Added{' '}
                {new Date(doc.createdAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {doc.isTruncated && (
              <Badge tone="amber" title="Document text exceeded limits and was partially truncated. Study materials cover the first 200,000 characters.">
                Partially truncated
              </Badge>
            )}
            {ready.length > 0 ? (
              ready.map((key) => {
                const Icon = PANEL_ICONS[key];
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <Badge key={key} tone="emerald" className="gap-1 capitalize">
                    {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
                    {label} ready
                  </Badge>
                );
              })
            ) : (
              <Badge tone="slate">No materials generated</Badge>
            )}
          </div>
        </div>
      </div>

      {doc.isTruncated && !dismissedTruncation && (
        <Alert type="info" onDismiss={() => setDismissedTruncation(true)}>
          This document was partially truncated due to size. Study materials are generated from the first 200,000 characters.
        </Alert>
      )}

      {error && (
        <Alert type="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr] lg:items-start">
        {/* Document switcher sidebar */}
        <aside className="hidden lg:block lg:sticky lg:top-20">
          <Card padding="none">
            <p className="border-b border-border-subtle px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
              Your Library
            </p>
            <ul className="sm-scroll max-h-[24rem] overflow-y-auto">
              {/* Current document */}
              <li>
                <span className="flex items-center gap-2 border-l-2 border-accent bg-accent-subtle/40 px-3.5 py-2.5 text-xs font-medium text-accent">
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{doc.title || doc.originalName}</span>
                </span>
              </li>
              {others.map((item) => (
                <li key={item._id}>
                  <Link
                    to={`/documents/${item._id}?tab=${tab}`}
                    className="flex items-center gap-2 border-l-2 border-transparent px-3.5 py-2.5 text-xs text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-primary"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                    <span className="truncate">{item.title || item.originalName}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-border-subtle p-3">
              <Link to="/documents">
                <Button variant="secondary" size="xs" fullWidth className="gap-1.5">
                  <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload another PDF
                </Button>
              </Link>
            </div>
          </Card>
        </aside>

        {/* Main panel area */}
        <div className="min-w-0 space-y-5">
          <SegmentedTabs items={tabItems} value={tab} onChange={setTab} />

          <div key={tab} className="animate-fade-in">
            <ActivePanel document={doc} onGenerated={handleGenerated} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ws-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => { if (!deleting) setShowDeleteModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-danger/30 bg-danger-subtle text-danger">
                <AlertTriangle className="h-5 w-5 stroke-[2]" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="ws-delete-title" className="text-base font-semibold tracking-tight text-primary">
                  Delete Document
                </h3>
                <p className="mt-1 text-xs text-secondary leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-primary">
                    &quot;{docTitle.replace(/\.pdf$/i, '')}&quot;
                  </span>
                  ? All generated notes, flashcards, and quiz questions will be permanently removed.
                  This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleConfirmDelete}
              >
                Delete Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
