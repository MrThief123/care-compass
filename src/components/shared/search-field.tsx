import { cn } from "@/lib/utils";

import { Icon } from "../ui/icon";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  /** Set to the query that produced zero results, to show the no-results message. */
  noResultsFor?: string;
  placeholder?: string;
  className?: string;
}

export function SearchField({
  value,
  onChange,
  onClear,
  loading = false,
  noResultsFor,
  placeholder = "Search",
  className,
}: SearchFieldProps) {
  return (
    <div className={className}>
      <div className="flex h-11 items-center gap-2 rounded-control border border-border-default bg-bg-surface px-3">
        <Icon name="search" size={16} className="shrink-0 text-text-secondary" />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-body-default text-text-primary outline-none placeholder:text-text-secondary"
        />
        {loading && (
          <span role="status" aria-label="Searching" className="shrink-0">
            <Icon name="sliders" size={16} className="animate-spin text-text-secondary" />
          </span>
        )}
        {!loading && value.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg-inset",
            )}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
      {noResultsFor && (
        <p className="mt-2 text-body-small text-text-secondary">
          No matches for &quot;{noResultsFor}&quot;.
        </p>
      )}
    </div>
  );
}
