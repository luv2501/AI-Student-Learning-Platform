import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-accent text-accent-contrast border border-transparent hover:bg-accent-hover active:bg-accent shadow-xs',
  secondary:
    'border border-border-subtle bg-surface text-primary hover:bg-subtle active:bg-surface shadow-xs',
  ghost:
    'border border-transparent text-secondary hover:bg-subtle hover:text-primary active:bg-subtle/80',
  danger:
    'bg-danger text-white border border-transparent hover:bg-danger/90 active:bg-danger/80 shadow-xs',
  subtle:
    'bg-accent-subtle text-accent border border-accent/20 hover:bg-accent-subtle/80 active:bg-accent-subtle/60',
};

const sizes = {
  xs: 'px-2 py-1 text-xs gap-1.5 min-h-[28px]',
  sm: 'px-2.5 py-1.5 text-xs font-medium gap-1.5 min-h-[32px]',
  md: 'px-3.5 py-2 text-sm gap-2 min-h-[38px]',
  lg: 'px-4.5 py-2.5 text-base gap-2.5 min-h-[44px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  type = 'button',
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center rounded-md font-medium tracking-tight transition-colors duration-150 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${variantClass} ${sizeClass} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin shrink-0 stroke-[2.2]" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

