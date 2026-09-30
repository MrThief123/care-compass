"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Field } from "@/components/shared/forms";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { saveClientInfoSection } from "@/server/clients/actions";
import type { ClientInfoSectionKind } from "@/types/domain";

export interface CarerInfoSectionCardProps {
  clientId: string;
  kind: ClientInfoSectionKind;
  title: string;
  content: string;
  /** Absent, not disabled, when false (CLAUDE.md §7): the carer is not on shift. */
  canEdit: boolean;
}

/**
 * One text card on Carer · Info (CAR-04). Looks like the Family card
 * (`family-info/info-section-card.tsx`, Lane F, not edited: FD-02) but Save calls
 * `saveClientInfoSection`. On a refusal (shift ended, too long) the message shows under the box
 * and the draft stays, so nothing the carer typed is lost. Focus goes into the textarea on
 * Edit and back to Edit on Save or Cancel.
 */
export function CarerInfoSectionCard({
  clientId,
  kind,
  title,
  content,
  canEdit,
}: CarerInfoSectionCardProps) {
  const router = useRouter();
  const headingId = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<"textarea" | "edit" | null>(null);

  const [text, setText] = useState(content);
  const [draft, setDraft] = useState(content);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target === "textarea") editorRef.current?.querySelector("textarea")?.focus();
    if (target === "edit") editRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setDraft(text);
    setError(undefined);
    focusNext.current = "textarea";
    setEditing(true);
  }

  function cancel() {
    setError(undefined);
    focusNext.current = "edit";
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      const result = await saveClientInfoSection(clientId, kind, draft);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setText(draft.trim());
      focusNext.current = "edit";
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CardShell role="region" aria-labelledby={headingId} className="flex flex-col gap-2.5 p-3.75">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2
          id={headingId}
          className="min-w-0 text-title-card text-text-primary [overflow-wrap:anywhere]"
        >
          {title}
        </h2>
        {canEdit && !editing && (
          <button
            ref={editRef}
            type="button"
            aria-label={`Edit ${title}`}
            onClick={startEditing}
            className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-control px-5 text-body-emphasis text-text-brand outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div ref={editorRef} className="flex flex-col gap-3">
          {/* The heading above already names the card, so the label is for assistive tech only. */}
          <Field
            label={title}
            type="textarea"
            value={draft}
            onChange={setDraft}
            error={error}
            className="[&>label]:sr-only"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>
              Save
            </Button>
            <Button variant="secondary" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : text === "" ? (
        <p className="text-body-default text-text-secondary">Nothing added yet.</p>
      ) : (
        <p className="whitespace-pre-line text-body-default text-text-primary [overflow-wrap:anywhere]">
          {text}
        </p>
      )}
    </CardShell>
  );
}
