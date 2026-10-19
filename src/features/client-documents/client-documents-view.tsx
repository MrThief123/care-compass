"use client";

import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/shared/lists/data-table";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";
import { fileTypeLabel, formatFileSize } from "@/features/family-task-detail/document-format";
import { TagList } from "@/features/tags/tag-list";
import { getDocumentUrl } from "@/server/documents/actions";
import { sortTagNames, uniqueTagNames } from "@/server/tags/tag-input";
import type { ClientDocument } from "@/types/domain";

import { DocumentTagsDialog } from "./document-tags-dialog";
import { formatDateAdded } from "./documents-format";
import {
  filterDocuments,
  sortDocuments,
  type DocumentSortDirection,
  type DocumentSortKey,
} from "./documents-sort";

const SORT_OPTIONS = [
  { value: "date-desc", label: "Date added (newest first)" },
  { value: "date-asc", label: "Date added (oldest first)" },
  { value: "name-asc", label: "Name (A to Z)" },
  { value: "name-desc", label: "Name (Z to A)" },
  { value: "size-desc", label: "Size (largest first)" },
  { value: "size-asc", label: "Size (smallest first)" },
] as const;

const OPEN_FAILED_MESSAGE = "Couldn't open that document.";
const NONE = "—";

export interface ClientDocumentsViewProps {
  clientId: string;
  documents: ClientDocument[];
  /** F0-29: each tagged document's tags, by document id. */
  tagsById?: Record<string, string[]>;
  /** F0-29: the client's tags, offered when editing a document's tags. */
  tagOptions?: string[];
  /** F0-29: Family may edit tags; a carer sees them and filters only. */
  canEditTags?: boolean;
}

/** The Tag select's value for "All tags"; never a tag name, since a name is at least one character. */
const ALL_TAGS = "";

/**
 * The Documents page (F0-25): every document of one client, with search, sorting, a per-file
 * open and Download all. The same screen for Family and for a carer on a patient's profile; it
 * has no upload, which stays on Info and the event form. Search, Tag and sort run over the loaded
 * list. Tags (F0-29): a Tags column when any document has one or the family may edit them, and a
 * Tag filter over the tags in use; the family edits a document's tags in a dialog.
 */
export function ClientDocumentsView({
  clientId,
  documents,
  tagsById = {},
  tagOptions = [],
  canEditTags = false,
}: ClientDocumentsViewProps) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState(ALL_TAGS);
  const [sort, setSort] = useState<string>("date-desc");
  const [error, setError] = useState("");
  // Tags saved here since the page loaded, shown until the refreshed page carries them.
  const [savedTags, setSavedTags] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState<ClientDocument>();

  const tagsOf = (documentId: string): string[] =>
    savedTags[documentId] ?? (Object.hasOwn(tagsById, documentId) ? tagsById[documentId]! : []);
  const tagsInUse = sortTagNames(
    uniqueTagNames(documents.flatMap((document) => tagsOf(document.id))),
  );
  const showTags = canEditTags || tagsInUse.length > 0;

  const shown = useMemo(() => {
    const [key, direction] = sort.split("-") as [DocumentSortKey, DocumentSortDirection];
    const needle = tagFilter.toLowerCase();
    const tagged =
      tagFilter === ALL_TAGS
        ? documents
        : documents.filter((document) =>
            (savedTags[document.id] ?? tagsById[document.id] ?? []).some(
              (tag) => tag.toLowerCase() === needle,
            ),
          );
    return sortDocuments(filterDocuments(tagged, query), key, direction);
  }, [documents, query, sort, tagFilter, tagsById, savedTags]);

  async function openDocument(documentId: string) {
    setError("");
    // Opened before the await so the browser treats it as the click's own tab (no popup block).
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const result = await getDocumentUrl(documentId);
      if (result.ok && tab) {
        tab.location.href = result.data.url;
        return;
      }
      tab?.close();
      setError(result.ok ? "Allow pop-ups to open documents." : result.error.message);
    } catch {
      tab?.close();
      setError(OPEN_FAILED_MESSAGE);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="px-6 py-5">
        <CardShell>
          <EmptyState
            icon="file"
            title="No documents yet"
            body="Documents added to the client's information or to a care event will appear here."
          />
        </CardShell>
      </div>
    );
  }

  const total = documents.length;
  const noun = total === 1 ? "document" : "documents";
  const count = shown.length === total ? `${total} ${noun}` : `${shown.length} of ${total} ${noun}`;

  const columns: DataTableColumn<ClientDocument>[] = [
    {
      key: "name",
      header: "Name",
      render: (document) => (
        <button
          type="button"
          aria-label={`Open ${document.name}`}
          title={document.name}
          onClick={() => void openDocument(document.id)}
          className="min-h-11 max-w-xs cursor-pointer text-left text-text-brand underline-offset-2 [overflow-wrap:anywhere] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {document.name}
        </button>
      ),
    },
    { key: "type", header: "Type", render: (document) => fileTypeLabel(document.mimeType) },
    { key: "size", header: "Size", render: (document) => formatFileSize(document.sizeBytes) },
    {
      key: "date",
      header: "Date added",
      render: (document) => formatDateAdded(document.uploadedAt),
    },
    { key: "by", header: "Added by", render: (document) => document.uploadedBy ?? NONE },
    {
      key: "event",
      header: "Attached to",
      render: (document) => (
        <span className="[overflow-wrap:anywhere]">{document.eventTitle ?? NONE}</span>
      ),
    },
    ...(showTags
      ? [
          {
            key: "tags",
            header: "Tags",
            render: (document: ClientDocument) => {
              const tags = tagsOf(document.id);
              return (
                <div className="flex max-w-56 flex-col items-start gap-1">
                  {tags.length > 0 ? <TagList tags={tags} /> : <span>{NONE}</span>}
                  {canEditTags && (
                    <button
                      type="button"
                      aria-label={`Edit tags for ${document.name}`}
                      onClick={() => setEditing(document)}
                      className="min-h-11 cursor-pointer text-left text-body-small text-text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      Edit tags
                    </button>
                  )}
                </div>
              );
            },
          } satisfies DataTableColumn<ClientDocument>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-60 flex-1 flex-col gap-1 text-body-small text-text-secondary">
          <span className="sr-only">Search documents</span>
          <span className="flex h-11 items-center gap-2 rounded-control border border-border-default bg-bg-surface px-3">
            <Icon name="search" size={16} className="shrink-0 text-text-secondary" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or event"
              aria-label="Search documents"
              className="w-full bg-transparent text-body-default text-text-primary outline-none placeholder:text-text-secondary"
            />
          </span>
        </label>
        {tagsInUse.length > 0 && (
          <label className="flex flex-col gap-1 text-body-small text-text-secondary">
            Tag
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="h-11 rounded-control border border-border-default bg-bg-surface px-3 text-body-default text-text-primary"
            >
              <option value={ALL_TAGS}>All tags</option>
              {tagsInUse.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-body-small text-text-secondary">
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-11 rounded-control border border-border-default bg-bg-surface px-3 text-body-default text-text-primary"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <a
          href={`/api/clients/${encodeURIComponent(clientId)}/documents/download-all`}
          download
          className="inline-flex h-11 items-center justify-center rounded-control border border-border-brand px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Download all ({total})
        </a>
      </div>

      <p role="status" className="text-body-small text-text-secondary">
        {count}
      </p>
      {error !== "" && (
        <p role="alert" className="text-body-small text-text-error">
          {error}
        </p>
      )}

      <CardShell className="overflow-x-auto">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2">
            <EmptyState
              icon="search"
              title="No documents match your search"
              body="Check the spelling, or clear the search to see every document."
            />
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTagFilter(ALL_TAGS);
              }}
              className="mb-4 inline-flex h-11 items-center rounded-control border border-border-brand px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Clear search
            </button>
          </div>
        ) : (
          <DataTable columns={columns} rows={shown} rowKey={(document) => document.id} />
        )}
      </CardShell>

      {editing && (
        <DocumentTagsDialog
          clientId={clientId}
          document={editing}
          options={sortTagNames(uniqueTagNames([...tagOptions, ...tagsInUse]))}
          initialTags={tagsOf(editing.id)}
          onSaved={(tags) => {
            setSavedTags((current) => ({ ...current, [editing.id]: sortTagNames(tags) }));
            setEditing(undefined);
          }}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
