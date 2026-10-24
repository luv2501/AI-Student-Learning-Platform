import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UploadCloud,
  FileText,
  Search,
  Trash2,
  ArrowRight,
  BookOpen,
  X,
  Loader2,
  AlertTriangle,
  FileUp,
} from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import Modal from '../components/ui/Modal.jsx';
import { SkeletonDocList } from '../components/ui/Skeleton.jsx';

function formatSize(bytes) {
  if (!bytes) return '0 KB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInput = useRef(null);

  const loadDocuments = useCallback(async () => {
    try {
      const { data } = await api.get('/documents');
      setDocuments(data.documents || []);
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle escape key to dismiss delete modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && docToDelete && !deleting) {
        setDocToDelete(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docToDelete, deleting]);

  async function uploadFile(file) {
    setError('');

    if (!file) {
      setError('Please select a PDF file');
      toast.error('Please select a PDF file');
      return;
    }
    if (!/\.pdf$/i.test(file.name)) {
      const msg = 'Only PDF files can be uploaded';
      setError(msg);
      toast.error(msg);
      return;
    }

    const form = new FormData();
    form.append('file', file);

    setUploading(true);
    setUploadProgress(10);

    try {
      const { data } = await api.post('/documents', form, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 90) / progressEvent.total);
            setUploadProgress(Math.max(15, percent));
          }
        },
      });

      setUploadProgress(100);
      const name = data.document.title || data.document.originalName;
      const count = data.document.pageCount;
      const successMsg = `"${name}" is ready with ${count} page${count === 1 ? '' : 's'} extracted.`;
      toast.success('Document uploaded', { description: successMsg });

      if (fileInput.current) fileInput.current.value = '';
      await loadDocuments();
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleConfirmDelete() {
    if (!docToDelete) return;
    const name = docToDelete.title || docToDelete.originalName;
    setDeleting(true);

    try {
      await api.delete(`/documents/${docToDelete._id}`);
      setDocuments((list) => list.filter((d) => d._id !== docToDelete._id));
      toast.success(`"${name}" deleted`, {
        description: 'Document and study materials removed from library.',
      });
      setDocToDelete(null);
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((d) => (d.title || d.originalName || '').toLowerCase().includes(term));
  }, [documents, search]);

  return (
    <div className="space-y-6">
      {/* 1. Editorial Header & Library Search */}
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              Document Library
            </h1>
            {!loading && (
              <Badge tone="slate" className="font-mono text-xs">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-secondary">
            Upload textbooks, syllabi, or research papers to extract concepts and generate AI study materials.
          </p>
        </div>

        {documents.length > 0 && (
          <div className="w-full sm:w-72">
            <Input
              id="library-search"
              placeholder="Filter documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftElement={<Search className="h-4 w-4 text-muted" aria-hidden="true" />}
              rightElement={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="rounded-xs p-0.5 text-muted hover:text-primary transition-colors cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null
              }
            />
          </div>
        )}
      </div>

      {error && (
        <Alert type="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 2. Refined Drag-and-Drop Upload Area */}
      <Card
        className={`transition-all duration-200 ${
          dragging ? 'border-accent bg-accent-subtle/30 ring-2 ring-accent/20' : ''
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
            if (!uploading && e.dataTransfer.files?.[0]) {
              uploadFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => {
            if (!uploading) fileInput.current?.click();
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
              e.preventDefault();
              fileInput.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload PDF document dropzone"
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-surface p-6 sm:p-8 text-center transition-colors cursor-pointer hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="grid h-12 w-12 place-items-center rounded-lg border border-border-subtle bg-subtle text-accent">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
            ) : (
              <UploadCloud className="h-6 w-6 stroke-[1.75] text-accent" aria-hidden="true" />
            )}
          </div>

          <div className="max-w-md space-y-1">
            <p className="text-sm font-medium text-primary">
              {uploading ? (
                'Extracting and indexing PDF content...'
              ) : (
                <>
                  Drag and drop your PDF here, or{' '}
                  <span className="text-accent underline underline-offset-2">browse files</span>
                </>
              )}
            </p>
            <p className="text-xs text-secondary">
              PDF files up to 25MB. Text-based documents supported.
            </p>
          </div>

          {uploading ? (
            <div className="w-full max-w-sm pt-2">
              <ProgressBar
                value={uploadProgress}
                tone="indigo"
                label="Uploading and parsing pages"
              />
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInput.current?.click();
              }}
              className="mt-1 gap-1.5"
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              <span>Select PDF</span>
            </Button>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                uploadFile(e.target.files[0]);
              }
            }}
            className="sr-only"
            aria-label="Choose PDF document"
          />
        </div>
      </Card>

      {/* 3. Document Cards & Grid Layout */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-primary">
            {search ? 'Search Results' : 'Library Documents'}
          </h2>
          {search && visible.length > 0 && (
            <span className="font-mono text-xs text-muted">
              {visible.length} of {documents.length} matching
            </span>
          )}
        </div>

        {loading ? (
          <SkeletonDocList count={6} variant="grid" />
        ) : documents.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<BookOpen className="h-6 w-6 text-muted" aria-hidden="true" />}
              title="Your library is empty"
              text="Upload a PDF above to extract key concepts and generate study notes, flashcards, and quizzes."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                  className="gap-1.5"
                >
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                  <span>Select PDF file</span>
                </Button>
              }
            />
          </Card>
        ) : visible.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<Search className="h-6 w-6 text-muted" aria-hidden="true" />}
              title="No documents found"
              text={`No documents in your library match "${search}". Try another keyword or clear the filter.`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((doc) => (
              <Card
                key={doc._id}
                padding="md"
                className="group flex flex-col justify-between transition-all duration-150 hover:border-primary/40 hover:shadow-xs"
              >
                <div>
                  {/* Card Header: PDF mark and delete trigger */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border-subtle bg-subtle text-accent group-hover:border-accent/40 group-hover:bg-accent-subtle/50 transition-colors">
                        <FileText className="h-5 w-5 stroke-[1.75]" aria-hidden="true" />
                      </div>
                      <span className="rounded-xs border border-border-subtle bg-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                        PDF
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger cursor-pointer"
                      aria-label={`Delete ${doc.title || doc.originalName}`}
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4 stroke-[1.75]" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mt-3 min-w-0">
                    <Link
                      to={`/documents/${doc._id}`}
                      className="block font-semibold text-primary hover:text-accent transition-colors tracking-tight line-clamp-2 text-sm leading-snug"
                      title={doc.title || doc.originalName}
                    >
                      {doc.title || doc.originalName}
                    </Link>
                  </div>

                  {/* Metadata Row in Geist Mono */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted">
                    <span>
                      {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatSize(doc.fileSize ?? doc.size)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {new Date(doc.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Material Presence Badges */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                    <Badge
                      tone={doc.hasNotes ? 'emerald' : 'slate'}
                      className={!doc.hasNotes ? 'opacity-65' : ''}
                    >
                      Notes
                    </Badge>
                    <Badge
                      tone={doc.hasFlashcards ? 'emerald' : 'slate'}
                      className={!doc.hasFlashcards ? 'opacity-65' : ''}
                    >
                      Flashcards
                    </Badge>
                    <Badge
                      tone={doc.hasQuiz ? 'emerald' : 'slate'}
                      className={!doc.hasQuiz ? 'opacity-65' : ''}
                    >
                      Quiz
                    </Badge>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="mt-4 border-t border-border-subtle/80 pt-3.5">
                  <Link to={`/documents/${doc._id}`} className="block w-full">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      className="gap-1.5 group-hover:border-accent group-hover:text-accent transition-colors"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Safety Confirmation Modal */}
      <Modal
        isOpen={Boolean(docToDelete)}
        ariaLabel="Delete Document"
        onClose={() => {
          if (!deleting) setDocToDelete(null);
        }}
      >
        {docToDelete && (
          <>
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-danger/30 bg-danger-subtle text-danger">
                <AlertTriangle className="h-5 w-5 stroke-[2]" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  id="modal-dialog-title"
                  className="text-base font-semibold tracking-tight text-primary"
                >
                  Delete Document
                </h3>
                <p
                  id="modal-dialog-description"
                  className="mt-1 text-xs text-secondary leading-relaxed"
                >
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-primary">
                    &quot;{docToDelete.title || docToDelete.originalName}&quot;
                  </span>
                  ? All generated notes, flashcards, and quizzes will be permanently deleted. This
                  action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDocToDelete(null)}
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
          </>
        )}
      </Modal>
    </div>
  );
}
