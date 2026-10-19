import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { ClientDocumentsView } from "@/features/client-documents/client-documents-view";
import { DocumentsErrorState } from "@/features/client-documents/documents-error-state";
import { getAllClientDocuments } from "@/server/documents/queries";
import type { ClientDocument } from "@/types/domain";

export default async function PatientDocumentsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  // Outside the try: redirect() throws and must reach Next.js. Viewing and downloading need an
  // assignment, not a shift in progress (F0-25 FD-07); there is no upload on this page.
  await findCarerPatient(clientId);

  let documents: ClientDocument[];
  try {
    documents = await getAllClientDocuments(clientId);
  } catch (error) {
    console.error(
      "[client-documents] could not load documents:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <DocumentsErrorState />;
  }

  return <ClientDocumentsView clientId={clientId} documents={documents} />;
}
