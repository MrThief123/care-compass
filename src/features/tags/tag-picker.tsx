"use client";

import { useId, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { TAGS_PER_ITEM_MAX, TagNameSchema } from "@/server/tags/tag-input";

export interface TagPickerProps {
  /** The client's tags, A to Z. */
  options: readonly string[];
  /** The chosen tags, in the order they were chosen. */
  value: readonly string[];
  onChange: (next: string[]) => void;
  label?: string;
}

const LIMIT_MESSAGE = `Up to ${TAGS_PER_ITEM_MAX} tags.`;

/**
 * Choose an item's tags (F0-29): the client's tags as toggle buttons (`aria-pressed`, with a
 * check mark when chosen so the state is not colour alone), and a box to add a new one. A new
 * name that is already a tag in any case chooses that tag instead. Names follow `TagNameSchema`;
 * at most `TAGS_PER_ITEM_MAX` are chosen. Enter in the box adds the tag and never submits the
 * form around it.
 */
export function TagPicker({ options, value, onChange, label = "Tags" }: TagPickerProps) {
  const inputId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();

  const chosen = new Set(value.map((tag) => tag.toLowerCase()));
  // The client's tags, then any chosen tag that is new (added here, not saved yet).
  const shown = [
    ...options,
    ...value.filter((tag) => !options.some((option) => option.toLowerCase() === tag.toLowerCase())),
  ];

  function choose(tag: string): boolean {
    if (chosen.has(tag.toLowerCase())) return true;
    if (value.length >= TAGS_PER_ITEM_MAX) {
      setError(LIMIT_MESSAGE);
      return false;
    }
    setError(undefined);
    onChange([...value, tag]);
    return true;
  }

  function toggle(tag: string) {
    if (chosen.has(tag.toLowerCase())) {
      setError(undefined);
      onChange(value.filter((current) => current.toLowerCase() !== tag.toLowerCase()));
    } else {
      choose(tag);
    }
  }

  function add() {
    const parsed = TagNameSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    const existing = shown.find((tag) => tag.toLowerCase() === parsed.data.toLowerCase());
    if (choose(existing ?? parsed.data)) setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    add();
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-body-default text-text-secondary">{label}</legend>
      {shown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shown.map((tag) => {
            const pressed = chosen.has(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={pressed}
                onClick={() => toggle(tag)}
                className={cn(
                  "inline-flex h-11 max-w-full items-center gap-1.5 rounded-control border px-4 text-body-default transition-colors [overflow-wrap:anywhere]",
                  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  pressed
                    ? "border-border-brand bg-primary text-primary-foreground"
                    : "border-border-brand bg-bg-surface text-text-primary hover:bg-bg-inset",
                )}
              >
                {pressed && <Icon name="check" size={16} aria-hidden className="shrink-0" />}
                {tag}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor={inputId} className="text-body-small text-text-secondary">
            New tag
          </label>
          <input
            id={inputId}
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(undefined);
            }}
            onKeyDown={handleKeyDown}
            placeholder="For example, Doctors"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "h-11 w-full rounded-control border bg-bg-surface px-3 text-body-default text-text-primary",
              "outline-none placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              error ? "border-border-alert" : "border-border-brand",
            )}
          />
        </div>
        <Button type="button" variant="secondary" onClick={add}>
          <Icon name="plus" size={16} aria-hidden />
          Add tag
        </Button>
      </div>
      <p id={errorId} className="text-body-small text-text-alert-strong empty:hidden">
        {error}
      </p>
    </fieldset>
  );
}
