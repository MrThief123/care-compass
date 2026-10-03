import { adminClientBase } from "@/features/admin-client-view/client-routes";
import { FamilyHomeView } from "@/features/family-home/family-home-view";
import { loadFamilyHomeData, type FamilyHomeData } from "@/features/family-home/home-data";
import { HomeErrorState } from "@/features/family-home/home-error-state";
import { assertAdminClientAccess } from "@/server/admin/client-access";

/**
 * Admin · client Home (ADM-11): the Family Home through the admin's account, with every action.
 * The layout has already checked access. Home's "Choose organisation" banner is not shown: a
 * client with no organisation cannot be opened by an admin (FD-02, FD-03).
 */
export default async function AdminClientHomePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  // A layout does not stop its page rendering: check here too, outside the try, so a client the
  // admin may not open reads nothing and logs nothing (ADM-11 FD-03).
  await assertAdminClientAccess(clientId);

  let data: FamilyHomeData;
  try {
    data = await loadFamilyHomeData(clientId);
  } catch (error) {
    // CLAUDE.md §7: a feature tag and the error's class only, no PII.
    console.error(
      "[admin-client-view] could not load home data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <HomeErrorState />;
  }

  return (
    <FamilyHomeView
      clientId={clientId}
      data={data}
      today={new Date()}
      basePath={adminClientBase(clientId)}
    />
  );
}
