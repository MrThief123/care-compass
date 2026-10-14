"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { addClientCustomSection } from "@/server/clients/custom-section-actions";
import {
  CUSTOM_SECTION_MESSAGES,
  MAX_CUSTOM_SECTIONS,
} from "@/server/clients/custom-section-input";
import type { ClientCustomSection } from "@/types/domain";

import { CustomSectionCard } from "./custom-section-card";
import { CustomSectionForm, type CustomSectionDraftErrors } from "./custom-section-form";

const SAVE_FAILED = "Couldn't save your changes. Try again.";

type FocusTarget = { kind: "heading"; id: string } | { kind: "add" };

export interface CustomSectionsProps {
  clientId: string;
  /** Oldest first, from `getClientCustomSections`. */
  sections: ClientCustomSection[];
  /** Family, an on-shift carer or an admin: Add section, Edit and Remove. Absent when false. */
  canEdit: boolean;
}

/**
 * The custom sections on Client Details (F0-26), drawn after Medical history and before
 * Documentation on Family, Carer and Admin. Its cards sit directly in the page's column. With
 * edit rights every section shows, written or not, then Add section (or the limit note at 20).
 * Without, only sections with text show and, if none have any, nothing renders.
 */
export function CustomSections({ clientId, sections, canEdit }: CustomSectionsProps) {
  const router = useRouter();
  const addId = useId();
  const headings = useRef(new Map<string, HTMLHeadingElement>());
  const focusNext = useRef<FocusTarget | null>(null);

  // Local list so a save shows at once; a refresh with new props replaces it.
  const [items, setItems] = useState(sections);
  const [prevSections, setPrevSections] = useState(sections);
  if (sections !== prevSections) {
    setPrevSections(sections);
    setItems(sections);
  }

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<CustomSectionDraftErrors>({});
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target?.kind === "heading") headings.current.get(target.id)?.focus();
    if (target?.kind === "add") document.getElementById(addId)?.focus();
  }, [items, adding, addId]);

  const visible = canEdit ? items : items.filter((section) => section.content.trim() !== "");
  if (visible.length === 0 && !canEdit) return null;

  function openForm() {
    setTitle("");
    setContent("");
    setErrors({});
    setAnnouncement("");
    setAdding(true);
  }

  function closeForm() {
    focusNext.current = { kind: "add" };
    setAdding(false);
  }

  async function add() {
    setBusy(true);
    setErrors({});
    try {
      const result = await addClientCustomSection(clientId, title, content);
      if (!result.ok) {
        setErrors(
          result.error.field
            ? { [result.error.field]: result.error.message }
            : { form: result.error.message },
        );
        return;
      }
      const section: ClientCustomSection = {
        id: result.data.id,
        clientId,
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      };
      focusNext.current = { kind: "heading", id: section.id };
      setItems((current) => [...current, section]);
      setAdding(false);
      router.refresh();
    } catch {
      setErrors({ form: SAVE_FAILED });
    } finally {
      setBusy(false);
    }
  }

  function saved(section: ClientCustomSection) {
    setItems((current) => current.map((item) => (item.id === section.id ? section : item)));
    router.refresh();
  }

  function removed(id: string, message?: string) {
    focusNext.current = { kind: "add" };
    setItems((current) => current.filter((item) => item.id !== id));
    setAnnouncement(message ?? "");
    router.refresh();
  }

  const atLimit = items.length >= MAX_CUSTOM_SECTIONS;

  return (
    <>
      {visible.map((section) => (
        <CustomSectionCard
          key={section.id}
          clientId={clientId}
          section={section}
          canEdit={canEdit}
          onSaved={saved}
          onRemoved={removed}
          headingRef={(element) => {
            if (element) headings.current.set(section.id, element);
            else headings.current.delete(section.id);
          }}
        />
      ))}

      {canEdit && adding && (
        <CardShell className="p-3.75">
          <CustomSectionForm
            label="New section"
            title={title}
            content={content}
            onTitleChange={setTitle}
            onContentChange={setContent}
            errors={errors}
            busy={busy}
            onSave={add}
            onCancel={closeForm}
          />
        </CardShell>
      )}

      {canEdit && (
        <div className="flex flex-col gap-2">
          {atLimit ? (
            <p className="text-body-default text-text-secondary">{CUSTOM_SECTION_MESSAGES.limit}</p>
          ) : (
            !adding && (
              <div>
                <Button id={addId} variant="secondary" onClick={openForm}>
                  Add section
                </Button>
              </div>
            )
          )}
          <p role="status" className="text-body-small text-text-secondary empty:hidden">
            {announcement}
          </p>
        </div>
      )}
    </>
  );
}
