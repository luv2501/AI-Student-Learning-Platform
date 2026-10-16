import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Search, FileText, UploadCloud } from 'lucide-react';
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

const tabs = [
  { key: 'notes', label: 'Notes', Panel: NotesPanel },
  { key: 'flashcards', label: 'Flashcards', Panel: FlashcardsPanel },
  { key: 'quiz', label: 'Quiz', Panel: QuizPanel },
  { key: 'ask', label: 'Ask PDF', Panel: AskPanel },
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

  async function handleDeleteDocument() {
    if (!doc) return;
    const name = doc.title || doc.originalName;
    if (!window.confirm(`Delete "${name}" and all generated materials?`)) return;

    try {
      await api.delete(`/documents/${doc._id}`);
      toast.success(`"${name}" deleted`);
      navigate('/documents');
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  }

  if (loading) return <SkeletonWorkspace />;

  if (!doc) {
    return (
      <Card>
        <EmptyState
          icon={<Search className="h-6 w-6 text-muted" aria-hidden="true" />}
          title="Document unavailable"
          text={error || 'This document could not be found.'}
          action={
            <Link to="/documents">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to library
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const ActivePanel = tabs.find((t) => t.key === tab).Panel;
  const others = library.filter((item) => item._id !== id);

  const ready = [
    (doc.hasNotes || Boolean(doc.notes)) && 'Notes',
    (doc.hasFlashcards || (Array.isArray(doc.flashcards) && doc.flashcards.length > 0)) && 'Flashcards',
    (doc.hasQuiz || (Array.isArray(doc.quiz) && doc.quiz.length > 0)) && 'Quiz',
  ].filter(Boolean);

  const docTitle = doc.title || doc.originalName || '';

  return (
    <div className="space-y-5">
      {/* Workspace header */}
      <div>
        <div className="flex items-center justify-between">
          <Link
            to="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Library
          </Link>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleDeleteDocument}
            className="text-danger hover:bg-danger-subtle hover:text-danger gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete PDF
          </Button>
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {docTitle.replace(/\.pdf$/i, '')}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted">
              {doc.pageCount} page{doc.pageCount === 1 ? '' : 's'} ·{' '}
              {doc.textLength.toLocaleString()} characters · added{' '}
              {new Date(doc.createdAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {doc.isTruncated && (
              <Badge tone="amber" title="Document text exceeded processing limits and was partially truncated. Study materials cover the first 200,000 characters.">
                Text partially truncated
              </Badge>
            )}
            {ready.length > 0 ? (
              ready.map((label) => (
                <Badge key={label} tone="emerald">
                  {label} ready
                </Badge>
              ))
            ) : (
              <Badge tone="slate">Nothing generated yet</Badge>
            )}
          </div>
        </div>
      </div>

      {doc.isTruncated && !dismissedTruncation && (
        <Alert type="info" onDismiss={() => setDismissedTruncation(true)}>
          Document text exceeded processing limits and was partially truncated. Study materials cover the first 200,000 characters.
        </Alert>
      )}

      <Alert type="error" onDismiss={() => setError('')}>
        {error}
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr] lg:items-start">
        {/* Document switcher */}
        <aside className="hidden lg:block lg:sticky lg:top-20">
          <Card padding="none">
            <p className="border-b border-border-subtle px-4 py-3 text-[11px] font-mono font-medium uppercase tracking-wider text-muted">
              Your documents
            </p>
            <ul className="sm-scroll max-h-[26rem] overflow-y-auto">
              <li>
                <span className="flex items-center gap-2 border-l-2 border-accent bg-accent-subtle/50 px-3.5 py-2.5 text-xs font-medium text-accent">
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{doc.title || doc.originalName}</span>
                </span>
              </li>
              {others.map((item) => (
                <li key={item._id}>
                  <Link
                    to={`/documents/${item._id}?tab=${tab}`}
                    className="flex items-center gap-2 border-l-2 border-transparent px-3.5 py-2.5 text-xs text-secondary transition hover:border-border-subtle hover:bg-subtle hover:text-primary"
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

        <div className="min-w-0 space-y-5">
          <SegmentedTabs
            items={tabs.map((t) => ({
              key: t.key,
              label: t.label,
              badge:
                (t.key === 'flashcards' && doc.flashcards?.length) ||
                (t.key === 'quiz' && doc.quiz?.length) ||
                undefined,
            }))}
            value={tab}
            onChange={setTab}
          />

          <div key={tab} className="animate-fade-in">
            <ActivePanel document={doc} onGenerated={handleGenerated} />
          </div>
        </div>
      </div>
    </div>
  );
}
