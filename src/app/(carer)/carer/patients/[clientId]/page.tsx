import { redirect } from "next/navigation";

/** Opens on Info until CAR-04 wires Home (FD-01), then this goes to `home`. */
export default async function PatientPage({ params }: { params: Promise<{ clientId: string }> }) {
  redirect(`/carer/patients/${(await params).clientId}/info`);
}
