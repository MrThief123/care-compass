// The Carer Home error state already reads 'Try again' and names no screen, so Settings reuses it.
import { CarerHomeErrorState } from "@/features/carer-home/carer-home-error-state";
import { CarerSettingsView } from "@/features/carer-settings/carer-settings-view";
import { getCurrentUser } from "@/server/auth/queries";
import { getCarerContactDetails, type CarerContactDetails } from "@/server/profiles/queries";

export default async function CarerSettingsPage() {
  let contact: CarerContactDetails;
  try {
    const { profileId } = await getCurrentUser("carer");
    contact = await getCarerContactDetails(profileId);
  } catch (error) {
    // A rejected read is the screen's error state. Log the error's class only:
    // the message may carry personal data (ARCHITECTURE.md §12.5, no PII).
    console.error(
      "[carer-settings] could not load settings data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <CarerHomeErrorState />;
  }

  return <CarerSettingsView contact={contact} />;
}
