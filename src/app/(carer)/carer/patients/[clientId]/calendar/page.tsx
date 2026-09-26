import { ComingSoon } from "@/features/carer-patients/coming-soon";

// Takes the route's params like every patient tab; unused until CAR-04 wires this tab (FD-01).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function Page(_props: { params: Promise<{ clientId: string }> }) {
  return <ComingSoon />;
}
