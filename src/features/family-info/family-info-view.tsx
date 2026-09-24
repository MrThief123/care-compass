import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

import { DocumentationCard } from "./documentation-card";
import { InfoSectionCard } from "./info-section-card";

import type { FamilyInfoData } from "./info-data";

export interface FamilyInfoViewProps {
  data: FamilyInfoData;
  /** Family may edit a client's information (PRD Scope: `canEdit=true`). */
  canEdit?: boolean;
}

/**
 * Family · Info (FAM-UI-04): the Description, Habits, Medical history and
 * Documentation cards. Composed here rather than from the shared
 * `ClientInfoView` (FD-01). The client's name and summary line are the shell
 * header's, not repeated here (FD-08). With no sections and no documents the
 * cards give way to one empty state.
 */
export function FamilyInfoView({ data, canEdit = true }: FamilyInfoViewProps) {
  const { sections, documents } = data;
  const isEmpty = sections.length === 0 && documents.length === 0;

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
          {sections.map((section) => (
            <InfoSectionCard
              key={section.id}
              title={section.title}
              content={section.content}
              canEdit={canEdit}
            />
          ))}
          <DocumentationCard documents={documents} canEdit={canEdit} />
        </>
      )}
    </div>
  );
}
