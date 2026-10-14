import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import { Logo } from './Navbar.jsx';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* key restarts the entrance animation on every route change */}
      <main
        key={location.pathname}
        className="animate-rise mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
      >
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo className="opacity-70" />
          <p>AI powered study workspace for students</p>
        </div>
      </footer>
    </div>
  );
}
