import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '', variant = 'button' }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label="Theme selection"
        className={`inline-flex items-center gap-0.5 rounded-md border border-border-subtle bg-subtle p-0.5 ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-label="Light theme"
          aria-pressed={theme === 'light'}
          className={`cursor-pointer rounded-sm p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
            theme === 'light'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-muted hover:text-primary'
          }`}
        >
          <Sun className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-label="Dark theme"
          aria-pressed={theme === 'dark'}
          className={`cursor-pointer rounded-sm p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
            theme === 'dark'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-muted hover:text-primary'
          }`}
        >
          <Moon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setTheme('system')}
          aria-label="System theme"
          aria-pressed={theme === 'system'}
          className={`cursor-pointer rounded-sm p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
            theme === 'system'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-muted hover:text-primary'
          }`}
        >
          <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Current theme: ${theme} (${resolvedTheme}). Click to cycle.`}
      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-subtle bg-surface text-secondary transition-colors hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${className}`}
    >
      {resolvedTheme === 'dark' ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
