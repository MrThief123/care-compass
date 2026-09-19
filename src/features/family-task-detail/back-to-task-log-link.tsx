import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { taskLogHref } from "@/features/family-task-log/task-routes";

/** '‹ Back to Task log' (design: Task detail). 44px target, brand text. */
export function BackToTaskLogLink({ clientId }: { clientId: string }) {
  return (
    <Link
      href={taskLogHref(clientId)}
      className="inline-flex min-h-11 items-center gap-1 self-start text-body-emphasis text-text-brand hover:underline"
    >
      <Icon name="chevron-left" size={16} aria-hidden />
      Back to Task log
    </Link>
  );
}
