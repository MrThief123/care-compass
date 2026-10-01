import { redirect } from "next/navigation";

import { ViewOnlyNotice } from "@/features/carer-patients/edit-status";
import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { carerPatientBase } from "@/features/carer-patients/patient-routes";
import { loadTaskLog } from "@/features/family-task-log/load-task-log";
import { TaskLogView } from "@/features/family-task-log/task-log-view";

/**
 * Carer · patient Care log (CAR-06, CHG-043): the Family Task log through the carer's account,
 * read-only. Rows open the read-only Task detail under the carer's own path.
 */
export default async function CarerCareLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
  const patient = await findCarerPatient(clientId);
  const basePath = carerPatientBase(clientId);
  const loaded = await loadTaskLog(clientId, await searchParams, basePath);

  if (loaded.kind === "redirect") redirect(loaded.href);

  return (
    <>
      {!patient.onShift && <ViewOnlyNotice firstName={patient.firstName} purpose="tasks" />}
      <TaskLogView
        clientId={clientId}
        items={loaded.items}
        total={loaded.total}
        pageSize={loaded.pageSize}
        params={loaded.params}
        basePath={basePath}
      />
    </>
  );
}
