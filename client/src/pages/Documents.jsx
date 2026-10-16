import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../lib/api.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { SkeletonCards } from '../components/ui/Skeleton.jsx';

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
      setError(apiErrorMessage(err));
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

    if (!file) return setError('Choose a PDF file first');
    if (!/\.pdf$/i.test(file.name)) return setError('Only PDF files can be uploaded');

    const form = new FormData();
    form.append('file', file);

    setUploading(true);
    try {
      const { data } = await api.post('/documents', form);
      const name = data.document.title || data.document.originalName;
      setSuccess(
        `"${name}" is ready — ${data.document.pageCount} page(s) of text extracted.`
      );
      if (fileInput.current) fileInput.current.value = '';
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
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
    } catch (err) {
      setError(apiErrorMessage(err));
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Document library
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload any document to understand its contents with AI notes, flashcards, quizzes and questions.
        </p>
      </div>

      {/* Upload — click or drag and drop */}
      <Card
        className={`transition-all duration-200 ${
          dragging ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-100' : ''
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
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-xl">
            {uploading ? <Spinner className="h-5 w-5 text-indigo-600" /> : '⬆'}
          </span>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {uploading ? 'Reading your PDF...' : 'Drop a PDF here, or choose a file'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Text based PDFs up to 10 MB. Scanned pages are not supported yet.
            </p>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            disabled={uploading}
            onChange={(e) => uploadFile(e.target.files?.[0])}
            className="block w-full max-w-sm cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:border-slate-400 hover:file:bg-indigo-100"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 pb-4">
          <div>
            <h2 className="font-semibold tracking-tight text-slate-900">Your documents</h2>
            <p className="mt-0.5 text-sm text-slate-500">
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
          <div className="p-5">
            <SkeletonCards count={3} />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon="📚"
            title="Your library is empty"
            text="Upload your first document above and FileSense will turn it into study material."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="🔍"
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
                className="group flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3.5 transition-colors last:border-0 hover:bg-slate-50/70 sm:px-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-[10px] font-bold text-rose-600">
                  PDF
                </span>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/documents/${doc._id}`}
                    className="block truncate text-sm font-semibold text-slate-900 transition hover:text-indigo-700"
                  >
                    {doc.title || doc.originalName}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
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

                <div className="flex shrink-0 items-center gap-1">
                  <Link to={`/documents/${doc._id}`}>
                    <Button size="sm">Study</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => remove(doc)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Delete
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
