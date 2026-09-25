import Link from "next/link";

import { Icon } from "@/components/ui/icon";

import { backLinkFor, type TaskDetailOrigin } from "./task-detail-origin";

/**
 * '‹ Back to …' (design: Task detail). 44px target, brand text. `origin` is where the task was
 * opened from, already validated (`parseTaskDetailOrigin`), so Back returns to that exact
 * Calendar, Home or Task log view (CHG-014). Without one it is 'Back to Task log'.
 */
export function BackLink({ clientId, origin }: { clientId: string; origin?: TaskDetailOrigin }) {
  const { label, href } = backLinkFor(clientId, origin);
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1 self-start text-body-emphasis text-text-brand hover:underline"
    >
      <Icon name="chevron-left" size={16} aria-hidden />
      {label}
    </Link>
  );
}
