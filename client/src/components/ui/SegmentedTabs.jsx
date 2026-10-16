/**
 * Horizontal tab switcher. Scrolls instead of wrapping on small screens.
 * items: [{ key, label, badge }]
 */
export default function SegmentedTabs({ items, value, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`sm-scroll flex gap-1 overflow-x-auto rounded-lg border border-border-subtle bg-subtle p-1 ${className}`}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item.key)}
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
