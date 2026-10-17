import type { ClientDetails } from "./client-details-schema";

/**
 * The `save_client_details` arguments for a client's details (F0-28): every field is sent, and a
 * field that is not set is null, which clears it. Shared by `saveClientDetails` and `signUp`.
 * The generated types make every argument a string; the function takes null (FD-07).
 */
export function saveClientDetailsArgs(clientId: string, details: ClientDetails) {
  return {
    p_client_id: clientId,
    p_date_of_birth: (details.dateOfBirth ?? null) as string,
    p_email: (details.email ?? null) as string,
    p_phone: (details.phone ?? null) as string,
    p_address: (details.address ?? null) as string,
    p_suburb: (details.suburb ?? null) as string,
    p_emergency_contact_name: (details.emergencyContactName ?? null) as string,
    p_emergency_contact_relationship: (details.emergencyContactRelationship ?? null) as string,
    p_emergency_contact_phone: (details.emergencyContactPhone ?? null) as string,
  };
}
