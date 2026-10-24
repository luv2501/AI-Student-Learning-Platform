/**
 * FileSense Brand Mark & Full Logo Component.
 * Supports mark-only, full SVG, and responsive badge configurations.
 */
export default function Logo({ className = '', markOnly = false, fullSvg = false, showTagline = false }) {
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
        <span className="text-lg font-bold tracking-tight text-primary leading-none">
          FileSense
        </span>
        {showTagline && (
          <span className="mt-0.5 text-[10px] font-medium tracking-wider text-muted uppercase">
            Understand every document
          </span>
        )}
      </span>
    </span>
  );
}

export { Logo };
