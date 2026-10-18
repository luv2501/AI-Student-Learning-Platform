import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, Files, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center py-16 text-center">
      <div className="w-full max-w-md space-y-6">
        {/* Geist Mono numerical error chip */}
        <div className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-subtle px-3 py-1 font-mono text-xs font-medium text-secondary">
          <span className="font-semibold text-accent">404</span>
          <span className="text-muted" aria-hidden="true">//</span>
          <span className="uppercase tracking-wider text-muted">NOT_FOUND</span>
        </div>

        {/* Primary headline and restrained subtext */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            Page not found
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-secondary">
            The route you requested does not exist or has been relocated. Check the URL or return to your study workspace.
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Link to={user ? '/dashboard' : '/'}>
            <Button variant="primary" size="md" className="gap-2">
              {user ? (
                <>
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  <span>Back to Dashboard</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back to Home</span>
                </>
              )}
            </Button>
          </Link>

          <Link to={user ? '/documents' : '/login'}>
            <Button variant="secondary" size="md" className="gap-2">
              {user ? (
                <>
                  <Files className="h-4 w-4" aria-hidden="true" />
                  <span>Open Library</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Sign In</span>
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
