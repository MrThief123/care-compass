"use client";

import { useEffect, useRef } from "react";

import { Field } from "@/components/shared/forms";
import { Button } from "@/components/ui/button";

export interface CustomSectionDraftErrors {
  title?: string;
  content?: string;
  /** A refusal that is not about one field (shift ended, limit, failure). */
  form?: string;
}

export interface CustomSectionFormProps {
  /** The form's accessible name, e.g. "New section" or "Edit Communication". */
  label: string;
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  errors: CustomSectionDraftErrors;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Title and Text with Save and Cancel, for adding and editing a custom section (F0-26). Focus
 * goes to Title when the form opens. Field errors show under their field; anything else under
 * the buttons.
 */
export function CustomSectionForm({
  label,
  title,
  content,
  onTitleChange,
  onContentChange,
  errors,
  busy,
  onSave,
  onCancel,
}: CustomSectionFormProps) {
  const fieldsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fieldsRef.current?.querySelector("input")?.focus();
  }, []);

  return (
    <form
      aria-label={label}
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div ref={fieldsRef} className="flex flex-col gap-3">
        <Field label="Title" value={title} onChange={onTitleChange} error={errors.title} />
        <Field
          label="Text"
          type="textarea"
          value={content}
          onChange={onContentChange}
          error={errors.content}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
      {errors.form && (
        <p role="alert" className="text-body-small text-text-alert-strong">
          {errors.form}
        </p>
      )}
    </form>
  );
}
