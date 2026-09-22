import { PageHeader } from "@/components/shared/page-header";
import { Rail } from "@/components/shared/rail";
import { ScreenTitle } from "@/components/shared/screen-title";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { formatLongDate } from "@/lib/format/date";
import { getCurrentUser } from "@/server/auth/queries";

import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser("admin");

  return (
    <div className="flex min-h-screen bg-bg-canvas">
      <Rail role="admin" basePath="/admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          subject={<ScreenTitle role="admin" basePath="/admin" />}
          date={formatLongDate(new Date())}
          userFirstName={user.firstName}
          signOutSlot={<SignOutButton />}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
