import { ClientBar } from "@/features/admin-client-view/client-bar";
import { assertAdminClientAccess } from "@/server/admin/client-access";
import { getClientHeaderSummary } from "@/server/clients/queries";

import type { ReactNode } from "react";

/** A client's Family screens inside the admin layout (ADM-11). The guard runs before any read. */
export default async function AdminClientLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await assertAdminClientAccess(clientId);
  const client = await getClientHeaderSummary(clientId);
  const name = [client.firstName, client.lastName].filter(Boolean).join(" ");

  return (
    <>
      <ClientBar clientId={clientId} clientName={name} />
      {children}
    </>
  );
}
