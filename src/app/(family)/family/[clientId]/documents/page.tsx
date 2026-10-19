import { ClientDocumentsView } from "@/features/client-documents/client-documents-view";
import { DocumentsErrorState } from "@/features/client-documents/documents-error-state";
import { getAllClientDocuments } from "@/server/documents/queries";
import { getClientTags, getDocumentTagsByClient } from "@/server/tags/queries";
import type { ClientDocument } from "@/types/domain";

export default async function FamilyDocumentsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let documents: ClientDocument[];
  let tagsById: Record<string, string[]>;
  let tagOptions: string[];
  try {
    // F0-29: the family sees and edits each document's tags.
    [documents, tagsById, tagOptions] = await Promise.all([
      getAllClientDocuments(clientId),
      getDocumentTagsByClient(clientId),
      getClientTags(clientId),
    ]);
  } catch (error) {
    // ARCHITECTURE.md §12.5: a feature tag and the error's class only, never its message.
    console.error(
      "[client-documents] could not load documents:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <DocumentsErrorState />;
  }

  return (
    <ClientDocumentsView
      clientId={clientId}
      documents={documents}
      tagsById={tagsById}
      tagOptions={tagOptions}
      canEditTags
    />
  );
}
