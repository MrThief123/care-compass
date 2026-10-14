import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { CustomSections } from "@/features/client-custom-sections/custom-sections";
import { PersonalDetailsCard } from "@/features/client-profile-details/personal-details-card";
import type { ClientDetails } from "@/server/clients/client-details-schema";
import type { ClientCustomSection, ClientInfoSectionKind } from "@/types/domain";

import { DocumentationCard } from "./documentation-card";
import { InfoSectionCard } from "./info-section-card";

import type { FamilyInfoData } from "./info-data";

const SECTIONS: ReadonlyArray<{ kind: ClientInfoSectionKind; title: string }> = [
  { kind: "description", title: "Description" },
  { kind: "habits", title: "Habits" },
  { kind: "medicalHistory", title: "Medical history" },
];

export interface FamilyInfoViewProps {
  clientId: string;
  data: FamilyInfoData;
  /** Sections added under the built-in three (F0-26), oldest first. */
  customSections?: ClientCustomSection[];
  /** Family may edit a client's information (PRD Scope: `canEdit=true`). */
  canEdit?: boolean;
  /** The client's personal details (F0-28), drawn first and read-only; left out when absent. */
  personalDetails?: ClientDetails;
  /** Family only: where the personal details are edited. */
  settingsHref?: string;
}

/**
 * Family · Info (FAM-UI-04): Personal details (F0-28, read-only), then the Description, Habits, Medical history and
 * Documentation cards, with any custom sections (F0-26) before Documentation. Composed here rather than from the shared
 * `ClientInfoView` (FD-01). The client's name and summary line are the shell
 * header's, not repeated here (FD-08). With no sections and no documents the
 * cards give way to one empty state, but only when the viewer cannot edit: a family member who
 * can edit always gets all three text cards, written or not, so a first entry can be added
 * (FAM-09 FD-04).
 */
export function FamilyInfoView({
  clientId,
  data,
  customSections = [],
  canEdit = true,
  personalDetails,
  settingsHref,
}: FamilyInfoViewProps) {
  const { sections, documents } = data;
  const isEmpty =
    !canEdit &&
    sections.length === 0 &&
    documents.length === 0 &&
    customSections.every((section) => section.content.trim() === "");

  return (
    <div className="flex flex-col gap-[22px] px-6 py-5">
      {personalDetails && (
        <PersonalDetailsCard details={personalDetails} settingsHref={settingsHref} />
      )}
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
            return (
              <InfoSectionCard
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
          <DocumentationCard clientId={clientId} documents={documents} canEdit={canEdit} />
        </>
      )}
    </div>
  );
}
