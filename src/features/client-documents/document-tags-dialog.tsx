"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmationModal } from "@/components/shared/forms/confirmation-modal";
import { TagPicker } from "@/features/tags/tag-picker";
import { setDocumentTags } from "@/server/tags/actions";

const SAVE_FAILED = "Couldn't save the tags. Try again.";

export interface DocumentTagsDialogProps {
  clientId: string;
  document: { id: string; name: string };
  /** The tags to choose from, A to Z. */
  options: string[];
  initialTags: string[];
  onSaved: (tags: string[]) => void;
  onClose: () => void;
}

/**
 * Family · Edit tags on one document (F0-29): the tag picker in a dialog. Save replaces the
 * document's tags; a failure keeps the dialog and the choice open with a message (AC-13). Kept
 * apart from the Documents view so only a page that can edit tags needs the router.
 */
export function DocumentTagsDialog({
  clientId,
  document,
  options,
  initialTags,
  onSaved,
  onClose,
}: DocumentTagsDialogProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await setDocumentTags(clientId, document.id, tags);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onSaved(tags);
      router.refresh();
    } catch {
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfirmationModal
      open
      title={`Tags for ${document.name}`}
      body={
        <div className="flex flex-col gap-3">
          <TagPicker options={options} value={tags} onChange={setTags} />
          {error !== "" && (
            <p role="alert" className="text-body-small text-text-alert-strong">
              {error}
            </p>
          )}
        </div>
      }
      confirmLabel="Save"
      onConfirm={() => void save()}
      onCancel={onClose}
      className="max-w-lg"
    />
  );
}
