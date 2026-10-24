import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  User,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Logo } from '../Logo.jsx';
import ThemeToggle from '../ThemeToggle.jsx';

export function MobileHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join('')
    : 'FS';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border-subtle bg-surface px-4 md:hidden">
      <Link to="/dashboard" aria-label="FileSense Home">
        <Logo markOnly={false} />
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-sm border border-border-subtle bg-subtle font-mono text-xs font-semibold text-primary transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="animate-fade-in absolute right-0 mt-2 w-52 overflow-hidden rounded-md border border-border-subtle bg-surface shadow-md"
            >
              <div className="border-b border-border-subtle px-3.5 py-2.5">
                <p className="truncate text-xs font-medium text-primary">{user?.name}</p>
                <p className="truncate font-mono text-[10px] text-muted">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs text-secondary transition hover:bg-subtle hover:text-primary"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                Profile Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-2 border-t border-border-subtle px-3.5 py-2 text-left text-xs text-danger transition hover:bg-danger-subtle"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileBottomBar() {
  const tabs = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/documents',
      label: 'Library',
      icon: BookOpen,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border-subtle bg-surface px-2 pb-safe md:hidden select-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-md px-3 py-1 transition-colors ${
                isActive
                  ? 'text-accent font-semibold'
                  : 'text-muted hover:text-primary'
              }`
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px] font-medium leading-none">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
