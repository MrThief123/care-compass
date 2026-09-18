import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import type { ClientInfoSection, DocumentRef } from "@/types/domain";

import { FileTile } from "./file-tile";

export interface ClientInfoViewProps {
  clientName: string;
  /** e.g. "75 years · Ringwood". */
  clientMeta: string;
  sections: ClientInfoSection[];
  documents: DocumentRef[];
  /** Controls render absent, not disabled, when false (UI-03 Functional Requirements). */
  canEdit: boolean;
  onEditSection?: (sectionId: string) => void;
  onAddFile?: () => void;
  className?: string;
}

/**
 * Client summary, section cards (Description / Habits / Medical history)
 * and Documentation file tiles (UI-03 PRD.md Scope). Admin cannot edit
 * client info (ARCHITECTURE.md §5.2, UI-D28) — callers pass `canEdit`
 * accordingly.
 */
export function ClientInfoView({
  clientName,
  clientMeta,
  sections,
  documents,
  canEdit,
  onEditSection,
  onAddFile,
  className,
}: ClientInfoViewProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-1">
        <p className="text-title-page text-text-primary">{clientName}</p>
        <p className="text-body-small text-text-secondary">{clientMeta}</p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {sections.map((section) => (
          <CardShell key={section.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-title-card text-text-primary">{section.title}</p>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => onEditSection?.(section.id)}
                >
                  Edit
                </Button>
              )}
            </div>
            <p className="text-body-default text-text-primary">{section.content}</p>
          </CardShell>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <p className="text-title-section text-text-primary">Documentation</p>
        <div className="flex flex-wrap gap-2">
          {documents.map((document) => (
            <FileTile key={document.id} variant="filled" fileName={document.name} />
          ))}
          {canEdit && <FileTile variant="add" onAdd={() => onAddFile?.()} />}
        </div>
      </div>
    </div>
  );
}
