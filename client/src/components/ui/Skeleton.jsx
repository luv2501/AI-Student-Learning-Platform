/** Placeholder block used while real content loads. */
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-subtle ${className}`} />;
}

/** A few stacked lines, for text-heavy panels. */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** Card-shaped placeholders for list and grid loading states. */
export function SkeletonCards({ count = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** High-fidelity row skeleton matching TaskItem structure. */
export function SkeletonTaskItem() {
  return (
    <div className="flex items-start gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
      <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 max-w-sm" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-4 w-12 rounded-sm" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Skeleton className="h-6 w-10 rounded-md" />
        <Skeleton className="h-6 w-12 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonTaskList({ count = 3 }) {
  return (
    <div className="divide-y divide-border-subtle">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTaskItem key={i} />
      ))}
    </div>
  );
}

/** High-fidelity row skeleton matching document list item. */
export function SkeletonDocItem() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3.5 sm:px-5">
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-1/2 max-w-xs" />
        <Skeleton className="h-3 w-1/3 max-w-[180px]" />
        <div className="flex items-center gap-1.5 pt-0.5">
          <Skeleton className="h-4 w-12 rounded-sm" />
          <Skeleton className="h-4 w-14 rounded-sm" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Skeleton className="h-7 w-14 rounded-md" />
        <Skeleton className="h-7 w-12 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonDocList({ count = 3 }) {
  return (
    <div className="divide-y divide-border-subtle">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonDocItem key={i} />
      ))}
    </div>
  );
}

/** High-fidelity skeleton matching StudyWorkspace full layout. */
export function SkeletonWorkspace() {
  return (
    <div className="animate-fade-in space-y-5">
      {/* Workspace header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-64 sm:w-80" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-sm" />
            <Skeleton className="h-5 w-24 rounded-sm" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr] lg:items-start">
        {/* Aside sidebar skeleton */}
        <div className="hidden lg:block">
          <div className="rounded-xl border border-border-subtle bg-surface p-3 space-y-3">
            <Skeleton className="h-3.5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
            <Skeleton className="h-7 w-full rounded-md mt-2" />
          </div>
        </div>

        {/* Main active panel skeleton */}
        <div className="min-w-0 space-y-5">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="rounded-xl border border-border-subtle bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
            <Skeleton className="h-20 w-full rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
