"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";
import {
  removeClientCustomSection,
  updateClientCustomSection,
} from "@/server/clients/custom-section-actions";
import type { ClientCustomSection } from "@/types/domain";

import { CustomSectionForm, type CustomSectionDraftErrors } from "./custom-section-form";

const SAVE_FAILED = "Couldn't save your changes. Try again.";
const REMOVE_FAILED = "Couldn't remove the section. Try again.";

/** Text-link control, as on the built-in cards' Edit: 44px tall, brand text. */
const LINK_CONTROL =
  "inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-control px-3 text-body-emphasis text-text-brand outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type Mode = "view" | "editing" | "confirming";
type FocusTarget = "edit" | "remove" | "keep";

export interface CustomSectionCardProps {
  clientId: string;
  section: ClientCustomSection;
  /** Absent, not disabled, when false (CLAUDE.md §7). */
  canEdit: boolean;
  /** Called after a save, with the trimmed title and text as stored. */
  onSaved: (section: ClientCustomSection) => void;
  /** Called after a removal, or when the section turns out to be gone, with a message to announce. */
  onRemoved: (id: string, message?: string) => void;
  /** Lets the list move focus to this card's heading after an add. */
  headingRef?: (element: HTMLHeadingElement | null) => void;
}

/**
 * One custom Client Details section (F0-26). Edit swaps the text for Title and Text fields with
 * Save and Cancel; Remove asks first, inside the card. A refusal keeps the draft and shows the
 * message where it applies (under a field, or under the buttons). Focus follows each step so a
 * keyboard user is never left on a control that has gone.
 */
export function CustomSectionCard({
  clientId,
  section,
  canEdit,
  onSaved,
  onRemoved,
  headingRef,
}: CustomSectionCardProps) {
  const headingId = useId();
  const keepId = useId();
  const editRef = useRef<HTMLButtonElement>(null);
  const removeRef = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<FocusTarget | null>(null);

  const [mode, setMode] = useState<Mode>("view");
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<CustomSectionDraftErrors>({});
  const [cardError, setCardError] = useState<string | undefined>();

  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target === "edit") editRef.current?.focus();
    if (target === "remove") removeRef.current?.focus();
    // `Button` takes no ref, so Keep is found by id.
    if (target === "keep") document.getElementById(keepId)?.focus();
  }, [mode, keepId]);

  function go(next: Mode, focus: FocusTarget) {
    focusNext.current = focus;
    setMode(next);
  }

  function startEditing() {
    setTitle(section.title);
    setContent(section.content);
    setErrors({});
    setCardError(undefined);
    // The form puts focus in its Title field.
    setMode("editing");
  }

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const result = await updateClientCustomSection(clientId, section.id, title, content);
      if (result.ok) {
        focusNext.current = "edit";
        setMode("view");
        onSaved({ ...section, title: title.trim(), content: content.trim() });
        return;
      }
      if (result.error.code === "NOT_FOUND") {
        onRemoved(section.id, result.error.message);
        return;
      }
      setErrors(
        result.error.field
          ? { [result.error.field]: result.error.message }
          : { form: result.error.message },
      );
    } catch {
      setErrors({ form: SAVE_FAILED });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setCardError(undefined);
    try {
      const result = await removeClientCustomSection(clientId, section.id);
      if (result.ok) {
        onRemoved(section.id);
        return;
      }
      setCardError(result.error.message);
      go("view", "remove");
    } catch {
      setCardError(REMOVE_FAILED);
      go("view", "remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CardShell role="region" aria-labelledby={headingId} className="flex flex-col gap-2.5 p-3.75">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3">
        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          className="min-w-0 text-title-card text-text-primary outline-none [overflow-wrap:anywhere]"
        >
          {section.title}
        </h2>
        {canEdit && mode === "view" && (
          <div className="flex shrink-0">
            <button
              ref={editRef}
              type="button"
              aria-label={`Edit ${section.title}`}
              onClick={startEditing}
              className={LINK_CONTROL}
            >
              Edit
            </button>
            <button
              ref={removeRef}
              type="button"
              aria-label={`Remove ${section.title}`}
              onClick={() => {
                setCardError(undefined);
                go("confirming", "keep");
              }}
              // Inset as the built-in cards' Edit, so the right edges line up.
              className={cn(LINK_CONTROL, "pr-5")}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {mode === "editing" ? (
        <CustomSectionForm
          label={`Edit ${section.title}`}
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={setContent}
          errors={errors}
          busy={busy}
          onSave={save}
          onCancel={() => go("view", "edit")}
        />
      ) : section.content === "" ? (
        <p className="text-body-default text-text-secondary">Nothing added yet.</p>
      ) : (
        <p className="whitespace-pre-line text-body-default text-text-primary [overflow-wrap:anywhere]">
          {section.content}
        </p>
      )}

      {mode === "confirming" && (
        <div className="flex flex-col gap-3 border-t border-border-subtle pt-3">
          <p className="text-body-default text-text-primary [overflow-wrap:anywhere]">
            Remove {section.title}? Its text will be lost.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={remove} disabled={busy}>
              Remove
            </Button>
            <Button
              id={keepId}
              variant="secondary"
              onClick={() => go("view", "remove")}
              disabled={busy}
            >
              Keep
            </Button>
          </div>
        </div>
      )}

      {cardError && (
        <p role="alert" className="text-body-small text-text-alert-strong">
          {cardError}
        </p>
      )}
    </CardShell>
  );
}
