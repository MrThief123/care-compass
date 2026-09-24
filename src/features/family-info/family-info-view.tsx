import { EmptyState } from "@/components/shared/states";
import { Avatar } from "@/components/ui/avatar";
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
 * Family · Info (FAM-UI-04): the client's name and summary line, then the
 * Description, Habits, Medical history and Documentation cards. Composed here
 * rather than from the shared `ClientInfoView` (FD-01). With no sections and no
 * documents the cards give way to one empty state.
 */
export function FamilyInfoView({ data, canEdit = true }: FamilyInfoViewProps) {
  const { client, sections, documents } = data;
  const isEmpty = sections.length === 0 && documents.length === 0;

  return (
    <div className="flex flex-col gap-[22px] px-6 py-5">
      <div className="mb-4 flex min-w-0 items-center gap-4">
        <Avatar name={client.firstName} size="lg" />
        <div className="flex min-w-0 flex-col">
          <h1 className="text-title-page text-text-primary [overflow-wrap:anywhere]">
            {client.firstName}
          </h1>
          <p className="text-body-small text-text-secondary [overflow-wrap:anywhere]">
            {client.meta}
          </p>
        </div>
      </div>

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
