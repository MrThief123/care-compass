"use client";

import { useParams } from "next/navigation";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { adminClientBase } from "@/features/admin-client-view/client-routes";
import { BackLink } from "@/features/family-task-detail/back-link";

/** Unknown or foreign occurrence key: the Family copy, with Back kept in the admin client view. */
export default function AdminTaskNotFound() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
      <BackLink clientId={clientId} basePath={adminClientBase(clientId)} />
      <CardShell>
        <EmptyState
          icon="search"
          title="Task not found"
          body="We couldn't find that task. It may have been removed."
        />
      </CardShell>
    </div>
  );
}
