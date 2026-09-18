import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { Icon, type IconName } from "../ui/icon";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body: string;
  className?: string;
}

export function EmptyState({ icon = "check", title, body, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-8 text-center", className)}>
      <Icon name={icon} size={20} className="text-text-muted" aria-hidden />
      <p className="text-title-card text-text-primary">{title}</p>
      <p className="text-body-default text-text-secondary">{body}</p>
    </div>
  );
}

export interface ErrorStateProps {
  onRetry: () => void;
  title?: string;
  body?: string;
  className?: string;
}

export function ErrorState({
  onRetry,
  title = "Something went wrong",
  body = "We couldn't load this page. Please try again.",
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-8 text-center", className)}>
      <Icon name="alert-triangle" size={20} className="text-text-alert" aria-hidden />
      <p className="text-title-card text-text-primary">{title}</p>
      <p className="text-body-default text-text-secondary">{body}</p>
      <Button variant="secondary" size="md" onClick={onRetry} className="mt-2">
        Retry
      </Button>
    </div>
  );
}

export function ListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("flex items-center gap-3 py-2", className)}
    >
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-bg-inset" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-bg-inset" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-bg-inset" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn("grid grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-card bg-bg-inset" />
      ))}
    </div>
  );
}
