import { redirect } from "next/navigation";

/** Opens on Home (CHG-029); it shows 'Coming soon' until CAR-04 wires it (FD-01). */
export default async function PatientPage({ params }: { params: Promise<{ clientId: string }> }) {
  redirect(`/carer/patients/${(await params).clientId}/home`);
}
