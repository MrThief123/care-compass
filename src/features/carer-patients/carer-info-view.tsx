import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { FamilyInfoData } from "@/features/family-info/info-data";
import type { ClientInfoSectionKind } from "@/types/domain";

import { CarerDocumentationCard } from "./carer-documentation-card";
import { CarerInfoSectionCard } from "./carer-info-section-card";

const SECTIONS: ReadonlyArray<{ kind: ClientInfoSectionKind; title: string }> = [
  { kind: "description", title: "Description" },
  { kind: "habits", title: "Habits" },
  { kind: "medicalHistory", title: "Medical history" },
];

/**
 * Carer · Info (CAR-04): Description, Habits, Medical history and Documentation. On shift
 * every section has a card, written or not, so a carer can add a first entry; off shift a
 * section that was never written is left out, and with nothing at all one empty state shows.
 */
export function CarerInfoView({
  clientId,
  data,
  canEdit,
}: {
  clientId: string;
  data: FamilyInfoData;
  canEdit: boolean;
}) {
  const { sections, documents } = data;
  const isEmpty = !canEdit && sections.length === 0 && documents.length === 0;

  return (
    <div className="flex flex-col gap-[22px] px-6 py-5">
      {isEmpty ? (
        <CardShell>
          <EmptyState
            icon="info"
            title="No information yet"
            body="Description, habits, medical history and documents will appear here once they are added."
          />
        </CardShell>
      ) : (
        <>
          {SECTIONS.map(({ kind, title }) => {
            const saved = sections.find((section) => section.kind === kind);
            if (!saved && !canEdit) return null;
            return (
              <CarerInfoSectionCard
                // A refresh with newer saved text remounts the card; a draft is never reset mid-edit.
                key={`${kind}:${saved?.updatedAt ?? ""}`}
                clientId={clientId}
                kind={kind}
                title={title}
                content={saved?.content ?? ""}
                canEdit={canEdit}
              />
            );
          })}
          <CarerDocumentationCard clientId={clientId} documents={documents} canEdit={canEdit} />
        </>
      )}
    </div>
  );
}
