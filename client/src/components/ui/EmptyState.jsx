import { isValidElement } from 'react';
import { FileText } from 'lucide-react';

/** Consistent empty state: icon, message and an optional action. */
export default function EmptyState({ icon, title, text, action, className = '' }) {
  // If icon is provided and is a valid React element, render it; otherwise default to Lucide FileText
  const renderIcon = () => {
    if (isValidElement(icon)) {
      return icon;
    }
    // If icon is a function/component
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className="h-6 w-6 text-muted" aria-hidden="true" />;
    }
    // If a string was passed that is not an emoji or is empty/default, or if no icon provided
    return <FileText className="h-6 w-6 text-muted" aria-hidden="true" />;
  };

  return (
    <div className={`animate-fade-in px-6 py-12 text-center ${className}`}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-border-subtle bg-subtle text-muted">
        {renderIcon()}
      </div>
      <p className="mt-3.5 text-sm font-medium text-primary">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-xs text-secondary leading-relaxed">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
