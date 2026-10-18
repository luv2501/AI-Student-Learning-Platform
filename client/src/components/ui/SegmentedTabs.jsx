import { useRef } from 'react';

/**
 * Horizontal tab switcher. Scrolls instead of wrapping on small screens.
 * Fully compliant with WAI-ARIA tablist pattern:
 * - ArrowLeft / ArrowRight / Home / End keyboard navigation
 * - Dynamic tabIndex (0 for active, -1 for inactive)
 * - aria-selected state
 *
 * items: [{ key, label, badge }]
 */
export default function SegmentedTabs({
  items,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Tool selection tabs',
}) {
  const tabRefs = useRef([]);

  function handleKeyDown(e, index) {
    let nextIndex = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % items.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      onChange(items[nextIndex].key);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`sm-scroll flex gap-1 overflow-x-auto rounded-lg border border-border-subtle bg-subtle p-1 ${className}`}
    >
      {items.map((item, index) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            ref={(el) => (tabRefs.current[index] = el)}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            type="button"
            onClick={() => onChange(item.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`flex flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              active
                ? 'bg-surface text-primary shadow-xs border border-border-subtle/60'
                : 'text-secondary hover:text-primary hover:bg-surface/40'
            }`}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== null && (
              <span
                className={`font-mono rounded-xs px-1.5 py-0.2 text-[10px] font-medium ${
                  active
                    ? 'bg-subtle text-primary border border-border-subtle/80'
                    : 'bg-surface/60 text-muted'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
