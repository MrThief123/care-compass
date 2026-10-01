import { redirect } from "next/navigation";

/** Opens on Home (CHG-029). */
export default async function PatientPage({ params }: { params: Promise<{ clientId: string }> }) {
  redirect(`/carer/patients/${(await params).clientId}/home`);
}
