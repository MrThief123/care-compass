"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Field } from "@/components/shared/forms";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";

export interface InfoSectionCardProps {
  title: string;
  content: string;
  /** Absent, not disabled, when false (CLAUDE.md §7). */
  canEdit: boolean;
}

/**
 * One text card (Description, Habits, Medical history). Edit swaps the text for
 * a textarea with Save and Cancel; the edit lives in this card's own state, so
 * cards edit independently and nothing is saved anywhere (Phase 1, PROPOSED
 * interaction). Focus goes into the textarea on Edit and back to Edit on Save or
 * Cancel, so a keyboard user is never left on a control that has disappeared.
 */
export function InfoSectionCard({ title, content, canEdit }: InfoSectionCardProps) {
  const headingId = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<"textarea" | "edit" | null>(null);

  const [text, setText] = useState(content);
  const [draft, setDraft] = useState(content);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target === "textarea") editorRef.current?.querySelector("textarea")?.focus();
    if (target === "edit") editRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setDraft(text);
    focusNext.current = "textarea";
    setEditing(true);
  }

  function stopEditing(save: boolean) {
    if (save) setText(draft.trim());
    focusNext.current = "edit";
    setEditing(false);
  }

  return (
    <CardShell role="region" aria-labelledby={headingId} className="flex flex-col gap-2.5">
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
            className="[&>label]:sr-only"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => stopEditing(true)}>Save</Button>
            <Button variant="secondary" onClick={() => stopEditing(false)}>
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
