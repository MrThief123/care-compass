import { FamilySettingsView } from "@/features/family-settings/family-settings-view";
import { SettingsErrorState } from "@/features/family-settings/settings-error-state";
import { getCurrentUser } from "@/server/auth/queries";
import {
  getClientHeaderSummary,
  getOrganisationChoices,
  type ClientHeaderSummary,
  type OrganisationChoice,
} from "@/server/clients/queries";
import { getFamilyContactDetails, type FamilyContactDetails } from "@/server/profiles/queries";

export default async function FamilySettingsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let header: ClientHeaderSummary;
  let contact: FamilyContactDetails;
  let organisations: OrganisationChoice[];
  try {
    const user = await getCurrentUser("family");
    [header, contact, organisations] = await Promise.all([
      getClientHeaderSummary(clientId),
      getFamilyContactDetails(user.profileId),
      getOrganisationChoices(clientId),
    ]);
  } catch (error) {
    // A rejected contract read is the screen's error state, not a crash.
    // ARCHITECTURE.md §12.5: log a feature tag and the error's class only; the
    // message may carry client data in Phase 3, and nothing here may log PII.
    console.error(
      "[family-settings] could not load settings data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <SettingsErrorState />;
  }

  return <FamilySettingsView header={header} contact={contact} organisations={organisations} />;
}
