import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UploadCloud,
  FileText,
  Search,
  BookOpen,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { SkeletonDocList } from '../components/ui/Skeleton.jsx';

function formatSize(bytes) {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const fileInput = useRef(null);

  async function load() {
    try {
      const { data } = await api.get('/documents');
      setDocuments(data.documents);
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadFile(file) {
    setError('');
    setSuccess('');

    if (!file) {
      setError('Choose a PDF file first');
      toast.error('Choose a PDF file first');
      return;
    }
    if (!/\.pdf$/i.test(file.name)) {
      setError('Only PDF files can be uploaded');
      toast.error('Only PDF files can be uploaded');
      return;
    }

    const form = new FormData();
    form.append('file', file);

    setUploading(true);
    try {
      const { data } = await api.post('/documents', form);
      const name = data.document.title || data.document.originalName;
      const successMsg = `"${name}" is ready — ${data.document.pageCount} page(s) extracted.`;
      setSuccess(successMsg);
      toast.success('Document uploaded', { description: successMsg });
      if (fileInput.current) fileInput.current.value = '';
      await load();
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function remove(doc) {
    const name = doc.title || doc.originalName;
    if (!window.confirm(`Delete "${name}" and everything generated from it?`)) return;

    setError('');
    try {
      await api.delete(`/documents/${doc._id}`);
      setDocuments((list) => list.filter((d) => d._id !== doc._id));
      toast.success(`"${name}" deleted`);
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((d) => (d.title || d.originalName || '').toLowerCase().includes(term));
  }, [documents, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
          Document library
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Upload any document to understand its contents with AI notes, flashcards, quizzes and questions.
        </p>
      </div>

      {/* Upload — click or drag and drop */}
      <Card
        className={`transition-all duration-200 ${
          dragging ? 'border-accent bg-accent-subtle/50 ring-2 ring-accent/20' : ''
        }`}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            uploadFile(e.dataTransfer.files?.[0]);
          }}
          className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border-subtle bg-subtle/40 px-4 py-8 text-center"
        >
          <span className="grid h-11 w-11 place-items-center rounded-md border border-border-subtle bg-surface text-accent">
            {uploading ? (
              <Spinner className="h-5 w-5 text-accent" />
            ) : (
              <UploadCloud className="h-5 w-5 text-accent" aria-hidden="true" />
            )}
          </span>

          <div>
            <p className="text-sm font-medium text-primary">
              {uploading ? 'Reading your PDF...' : 'Drop a PDF here, or choose a file'}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Text-based PDFs up to 10 MB. Scanned pages are not supported yet.
            </p>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            disabled={uploading}
            onChange={(e) => uploadFile(e.target.files?.[0])}
            className="block w-full max-w-sm cursor-pointer rounded-md border border-border-subtle bg-surface px-3 py-2 text-xs text-secondary transition file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-accent-subtle file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-accent hover:border-primary/40 hover:file:bg-accent-subtle/80"
          />
        </div>

        <Alert type="error" className="mt-3" onDismiss={() => setError('')}>
          {error}
        </Alert>
        <Alert type="success" className="mt-3" onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      </Card>

      {/* Library */}
      <Card padding="none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-4 pb-3">
          <div>
            <h2 className="font-medium tracking-tight text-primary text-sm sm:text-base">Your documents</h2>
            <p className="mt-0.5 text-xs text-muted font-mono">
              {documents.length} PDF{documents.length === 1 ? '' : 's'} uploaded
            </p>
          </div>
          {documents.length > 3 && (
            <div className="w-full sm:w-56">
              <Input
                id="search"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-4">
            <SkeletonDocList count={3} />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6 text-muted" aria-hidden="true" />}
            title="Your library is empty"
            text="Upload your first document above and FileSense will turn it into study material."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6 text-muted" aria-hidden="true" />}
            title="No matches"
            text={`Nothing in your library matches "${search}".`}
            action={
              <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <ul>
            {visible.map((doc) => (
              <li
                key={doc._id}
                className="group flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3.5 transition-colors last:border-0 hover:bg-subtle/50 sm:px-5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border-subtle bg-subtle text-accent">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/documents/${doc._id}`}
                    className="block truncate text-sm font-medium text-primary transition hover:text-accent"
                  >
                    {doc.title || doc.originalName}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {doc.pageCount} page{doc.pageCount === 1 ? '' : 's'} · {formatSize(doc.fileSize ?? doc.size)} ·{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {doc.hasNotes && <Badge tone="emerald">Notes</Badge>}
                    {doc.hasFlashcards && <Badge tone="emerald">Flashcards</Badge>}
                    {doc.hasQuiz && <Badge tone="emerald">Quiz</Badge>}
                    {!doc.hasNotes && !doc.hasFlashcards && !doc.hasQuiz && (
                      <Badge tone="slate">Not studied yet</Badge>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Link to={`/documents/${doc._id}`}>
                    <Button size="xs" className="gap-1">
                      Study
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => remove(doc)}
                    className="text-danger hover:bg-danger-subtle hover:text-danger"
                    aria-label={`Delete ${doc.title || doc.originalName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
