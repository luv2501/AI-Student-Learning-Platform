import { Link, NavLink } from 'react-router-dom';
import { Logo } from '../Navbar.jsx';
import ThemeToggle from '../ThemeToggle.jsx';
import Button from '../ui/Button.jsx';

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface/95 backdrop-blur-xs">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="FileSense Home">
          <Logo />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-subtle text-primary'
                  : 'text-secondary hover:bg-subtle hover:text-primary'
              }`
            }
          >
            Log in
          </NavLink>
          <Link to="/register">
            <Button size="xs" className="px-3 py-1.5">
              Get started
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
