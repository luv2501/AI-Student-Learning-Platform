/**
 * Horizontal tab switcher. Scrolls instead of wrapping on small screens.
 * items: [{ key, label, badge }]
 */
export default function SegmentedTabs({ items, value, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`sm-scroll flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm ${className}`}
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
            className={`flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {item.label}
            {item.badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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
