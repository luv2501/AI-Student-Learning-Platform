import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="py-20 text-center">
      <p className="bg-gradient-to-br from-indigo-500 to-violet-600 bg-clip-text text-7xl font-bold text-transparent">
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
        That link does not lead anywhere. Let's get you back to studying.
      </p>
      <Link to={user ? '/dashboard' : '/'} className="mt-6 inline-block">
        <Button>{user ? 'Back to dashboard' : 'Back home'}</Button>
      </Link>
    </div>
  );
}
