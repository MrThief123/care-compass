import { PageHeader } from "@/components/shared/page-header";
import { Rail } from "@/components/shared/rail";
import { Avatar } from "@/components/ui/avatar";
import { formatLongDate } from "@/lib/format/date";
import { getCurrentUser } from "@/server/auth/queries";
import { getClientHeaderSummary } from "@/server/clients/queries";

import type { ReactNode } from "react";

export default async function FamilyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const [user, client] = await Promise.all([
    getCurrentUser("family"),
    getClientHeaderSummary(clientId),
  ]);

  const meta = [`${client.age} years`, client.suburb, client.organisationName]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return (
    <div className="flex min-h-screen bg-bg-canvas">
      <Rail role="family" basePath={`/family/${clientId}`} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          subject={
            <>
              <Avatar name={client.firstName} size="lg" />
              <div className="flex flex-col">
                <p className="text-title-page text-text-primary">{client.firstName}</p>
                <p className="text-body-small text-text-secondary">{meta}</p>
              </div>
            </>
          }
          date={formatLongDate(new Date())}
          userFirstName={user.firstName}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
