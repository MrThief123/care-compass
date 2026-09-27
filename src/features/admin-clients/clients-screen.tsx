"use client";

import { useRef, useState } from "react";
import { z } from "zod";

import { Field } from "@/components/shared/forms/field";
import { SidePanelForm } from "@/components/shared/forms/side-panel-form";
import { DataTable } from "@/components/shared/lists/data-table";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";

export interface ClientRow {
  id: string;
  name: string;
  familyContact: string;
}
const schema = z.object({
  name: z.string().trim().min(1, "Enter a client name."),
  familyContact: z.string().trim().min(1, "Enter a family contact name."),
  email: z.string().trim().email("Enter a valid email address."),
  notes: z.string().trim(),
});
type Draft = z.infer<typeof schema>;
const blank: Draft = { name: "", familyContact: "", email: "", notes: "" };

export function ClientsScreen({ data }: { data: { clients: ClientRow[] } }) {
  const [clients, setClients] = useState(() => data.clients.map((client) => ({ ...client })));
  const [draft, setDraft] = useState<Draft>({ ...blank });
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [notice, setNotice] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  function change(key: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setNotice("");
  }
  function save() {
    const result = schema.safeParse(draft);
    if (!result.success) {
      const next: Partial<Record<keyof Draft, string>> = {};
      for (const issue of result.error.issues) next[issue.path[0] as keyof Draft] = issue.message;
      setErrors(next);
      setNotice("");
      requestAnimationFrame(() =>
        panel.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setClients((current) => [...current, { ...result.data, id: crypto.randomUUID() }]);
    setDraft({ ...blank });
    setErrors({});
    setNotice(result.data.name + " added. Changes reset when you reload.");
  }
  function startAdding() {
    setDraft({ ...blank });
    setErrors({});
    setNotice("");
    panel.current?.querySelector("input")?.focus();
  }
  return (
    <div className="grid min-h-[calc(100vh-76px)] grid-cols-1 gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <CardShell className="min-w-0 border-transparent p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-card text-text-primary">Client List</h2>
          <Button onClick={startAdding} aria-label="Add a new client">
            <Icon name="plus" aria-hidden />
            Add Client
          </Button>
        </div>
        {clients.length ? (
          <div className="overflow-x-auto">
            <DataTable
              className="min-w-[440px] [&_td]:py-1 [&_td]:break-words [&_td:last-child]:text-right [&_th:last-child]:text-right"
              rows={clients}
              rowKey={(client) => client.id}
              columns={[
                {
                  key: "name",
                  header: "Name",
                  render: (client) => (
                    <span className="inline-block max-w-64 [overflow-wrap:anywhere]">
                      {client.name}
                    </span>
                  ),
                },
                {
                  key: "familyContact",
                  header: "Family contact",
                  render: (client) => (
                    <span className="inline-block max-w-64 text-text-secondary [overflow-wrap:anywhere]">
                      {client.familyContact}
                    </span>
                  ),
                },
                {
                  key: "remove",
                  header: "Remove",
                  render: (client) => (
                    <a
                      role="link"
                      aria-disabled="true"
                      aria-label={"Remove " + client.name}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center px-4 text-body-default text-text-alert-strong"
                    >
                      Remove
                    </a>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <EmptyState title="No clients yet" body="Add a client to get started." />
        )}
      </CardShell>
      <div ref={panel} className="min-h-[520px]">
        <SidePanelForm
          title="Add Client"
          submitLabel="Add client"
          onSubmit={save}
          className="border-transparent"
        >
          <Field
            label="Client name"
            value={draft.name}
            onChange={(value) => change("name", value)}
            error={errors.name}
          />
          <Field
            label="Family contact name"
            value={draft.familyContact}
            onChange={(value) => change("familyContact", value)}
            error={errors.familyContact}
          />
          <Field
            label="Family contact email"
            name="email"
            value={draft.email}
            onChange={(value) => change("email", value)}
            error={errors.email}
          />
          <Field
            label="Notes"
            type="textarea"
            value={draft.notes}
            onChange={(value) => change("notes", value)}
            hint="Optional"
          />
          <p className="text-body-small text-text-secondary">
            Changes on this preview reset when you reload.
          </p>
          <p role="status" className="text-body-small text-text-secondary">
            {notice}
          </p>
        </SidePanelForm>
      </div>
    </div>
  );
}
