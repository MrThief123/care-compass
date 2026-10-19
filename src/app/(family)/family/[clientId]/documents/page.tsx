import { ClientDocumentsView } from "@/features/client-documents/client-documents-view";
import { DocumentsErrorState } from "@/features/client-documents/documents-error-state";
import { getAllClientDocuments } from "@/server/documents/queries";
import type { ClientDocument } from "@/types/domain";

export default async function FamilyDocumentsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let documents: ClientDocument[];
  try {
    documents = await getAllClientDocuments(clientId);
  } catch (error) {
    // ARCHITECTURE.md §12.5: a feature tag and the error's class only, never its message.
    console.error(
      "[client-documents] could not load documents:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <DocumentsErrorState />;
  }

  return <ClientDocumentsView clientId={clientId} documents={documents} />;
}
