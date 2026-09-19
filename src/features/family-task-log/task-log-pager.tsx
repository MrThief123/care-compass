import Link from "next/link";

import { cn } from "@/lib/utils";

import { lastPageFor, pageRange, pageWindow } from "./pagination";
import { taskLogHref } from "./task-routes";

import type { TaskLogParams } from "./task-log-params";

export interface TaskLogPagerProps {
  clientId: string;
  /** The validated view; `page` is the page being shown. Links keep its q and status. */
  params: TaskLogParams;
  total: number;
  pageSize: number;
}

/** 44px targets (REQ-N2); the current page is a plain marker, every other control a link. */
const CONTROL =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-control px-3 text-body-emphasis";
const LINK = cn(CONTROL, "text-text-brand hover:bg-bg-inset hover:underline");

/**
 * 'Showing 21-40 of 137', Previous / Next and a short window of page numbers
 * (CHG-005, AC-05). Real links, so Back/Forward, reload and sharing all work.
 * Renders nothing when everything fits on one page.
 */
export function TaskLogPager({ clientId, params, total, pageSize }: TaskLogPagerProps) {
  const last = lastPageFor(total, pageSize);
  if (last <= 1) return null;

  const { page } = params;
  const { from, to } = pageRange(page, pageSize, total);
  const href = (target: number) => taskLogHref(clientId, { ...params, page: target });

  return (
    <nav
      aria-label="Task log pages"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2"
    >
      <p className="text-body-small text-text-secondary">
        {from === to ? `Showing ${from} of ${total}` : `Showing ${from}-${to} of ${total}`}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {page > 1 && (
          <Link href={href(page - 1)} rel="prev" className={LINK}>
            Previous
          </Link>
        )}

        {pageWindow(page, last).map((slot, index) =>
          slot === "gap" ? (
            <span key={`gap-${index}`} aria-hidden className="px-1 text-text-secondary">
              …
            </span>
          ) : slot === page ? (
            <span
              key={slot}
              aria-current="page"
              className={cn(CONTROL, "bg-bg-inset text-text-primary")}
            >
              {slot}
            </span>
          ) : (
            <Link key={slot} href={href(slot)} aria-label={`Page ${slot}`} className={LINK}>
              {slot}
            </Link>
          ),
        )}

        {page < last && (
          <Link href={href(page + 1)} rel="next" className={LINK}>
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
