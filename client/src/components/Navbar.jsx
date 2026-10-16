import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './ui/Button.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/documents', label: 'Study workspace' },
  { to: '/profile', label: 'Profile' },
];

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export function Logo({ className = '', markOnly = false, fullSvg = false, showTagline = false }) {
  if (markOnly) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <img
          src="/logo-mark.svg"
          alt="FileSense logo"
          className="h-8 w-auto object-contain"
        />
      </span>
    );
  }

  if (fullSvg) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <img
          src="/logo.svg"
          alt="FileSense logo"
          className="h-8 w-auto object-contain"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo-mark.svg"
        alt="FileSense logo"
        className="h-8 w-auto shrink-0 object-contain"
      />
      <span className="flex flex-col text-left">
        <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
          FileSense
        </span>
        {showTagline && (
          <span className="mt-0.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
            Understand every document
          </span>
        )}
      </span>
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  // Close menus on navigation and on outside click.
  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to={user ? '/dashboard' : '/'} aria-label="FileSense home">
          <Logo />
        </Link>

        {user ? (
          <>
            {/* Desktop */}
            <div className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}

              <div className="relative ml-2" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={userOpen}
                  className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-200"
                >
                  {initials}
                </button>

                {userOpen && (
                  <div
                    role="menu"
                    className="animate-fade-in absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      Profile settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile trigger */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
            >
              <span className="space-y-1">
                <span className="block h-0.5 w-5 rounded bg-current" />
                <span className="block h-0.5 w-5 rounded bg-current" />
                <span className="block h-0.5 w-5 rounded bg-current" />
              </span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/login" className={linkClass}>
              Log in
            </NavLink>
            <Link to="/register" className="ml-1">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      {user && menuOpen && (
        <div className="animate-fade-in border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
