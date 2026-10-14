import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { CustomSections } from "@/features/client-custom-sections/custom-sections";
import { PersonalDetailsCard } from "@/features/client-profile-details/personal-details-card";
import type { FamilyInfoData } from "@/features/family-info/info-data";
import type { ClientDetails } from "@/server/clients/client-details-schema";
import type { ClientCustomSection, ClientInfoSectionKind } from "@/types/domain";

import { CarerDocumentationCard } from "./carer-documentation-card";
import { CarerInfoSectionCard } from "./carer-info-section-card";

const SECTIONS: ReadonlyArray<{ kind: ClientInfoSectionKind; title: string }> = [
  { kind: "description", title: "Description" },
  { kind: "habits", title: "Habits" },
  { kind: "medicalHistory", title: "Medical history" },
];

/**
 * Carer · Info (CAR-04): Personal details (F0-28, read-only), Description, Habits, Medical history, any custom sections (F0-26) and
 * Documentation. On shift
 * every section has a card, written or not, so a carer can add a first entry; off shift a
 * section that was never written is left out, and with nothing at all one empty state shows.
 */
export function CarerInfoView({
  clientId,
  data,
  customSections = [],
  canEdit,
  personalDetails,
}: {
  clientId: string;
  data: FamilyInfoData;
  /** Sections added under the built-in three (F0-26), oldest first. */
  customSections?: ClientCustomSection[];
  canEdit: boolean;
  /** The client's personal details (F0-28), drawn first and read-only; left out when absent. */
  personalDetails?: ClientDetails;
}) {
  const { sections, documents } = data;
  const isEmpty =
    !canEdit &&
    sections.length === 0 &&
    documents.length === 0 &&
    customSections.every((section) => section.content.trim() === "");

  return (
    <div className="flex flex-col gap-[22px] px-6 py-5">
      {personalDetails && <PersonalDetailsCard details={personalDetails} />}
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
          <CustomSections clientId={clientId} sections={customSections} canEdit={canEdit} />
          <CarerDocumentationCard clientId={clientId} documents={documents} canEdit={canEdit} />
        </>
      )}
    </div>
  );
}
