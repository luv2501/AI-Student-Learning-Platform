/** Consistent empty state: icon, message and an optional action. */
export default function EmptyState({ icon = '📄', title, text, action, className = '' }) {
  return (
    <div className={`animate-fade-in px-6 py-14 text-center ${className}`}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-2xl">
        {icon}
      </div>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
