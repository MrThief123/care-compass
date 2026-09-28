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
import type { AdminStaffData, StaffMember } from "@/server/admin/staff-queries";

type Draft = Omit<StaffMember, "id">;

export function StaffScreen({ data }: { data: AdminStaffData }) {
  const [staff, setStaff] = useState(() => data.staff.map((person) => ({ ...person })));
  const [selectedId, setSelectedId] = useState<string | null>(data.staff[0]?.id ?? null);
  const emptyDraft = (): Draft => ({ name: "", phone: "", email: "", role: data.roles[0] ?? "" });
  const [draft, setDraft] = useState<Draft>(() =>
    data.staff[0] ? { ...data.staff[0] } : emptyDraft(),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [notice, setNotice] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  function edit(person?: StaffMember) {
    setSelectedId(person?.id ?? null);
    setDraft(person ? { ...person } : emptyDraft());
    setErrors({});
    setNotice("");
    panel.current?.querySelector("input")?.focus();
  }

  function save() {
    const result = z
      .object({
        name: z.string().trim().min(1, "Enter a name."),
        phone: z.string().trim(),
        email: z.string().trim().email("Enter a valid email address."),
        role: z.string().refine((role) => data.roles.includes(role), "Choose a role."),
      })
      .safeParse(draft);
    if (!result.success) {
      const nextErrors: Partial<Record<keyof Draft, string>> = {};
      for (const issue of result.error.issues)
        nextErrors[issue.path[0] as keyof Draft] = issue.message;
      setErrors(nextErrors);
      setNotice("");
      return;
    }
    const saved = { ...result.data, id: selectedId ?? crypto.randomUUID() };
    setStaff((current) =>
      selectedId
        ? current.map((person) => (person.id === selectedId ? saved : person))
        : [...current, saved],
    );
    setSelectedId(saved.id);
    setDraft(result.data);
    setErrors({});
    setNotice(saved.name + " saved");
  }

  function change(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setNotice("");
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <div className="grid min-h-[calc(100vh-76px)] grid-cols-1 gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <CardShell className="min-w-0 border-transparent p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-card text-text-primary">Staff List</h2>
          <Button onClick={() => edit()}>
            <Icon name="plus" aria-hidden />
            Add Staff
          </Button>
        </div>
        {staff.length ? (
          <div className="overflow-x-auto">
            <DataTable
              className="min-w-[440px] [&_th:last-child]:sr-only [&_td:last-child]:text-right [&_td]:py-1"
              rows={staff}
              rowKey={(person) => person.id}
              columns={[
                { key: "name", header: "Name", render: (person) => person.name },
                {
                  key: "role",
                  header: "Role",
                  render: (person) => <span className="text-text-secondary">{person.role}</span>,
                },
                {
                  key: "edit",
                  header: "Edit",
                  render: (person) => (
                    <Button
                      variant="ghost"
                      aria-label={"Edit " + person.name}
                      onClick={() => edit(person)}
                    >
                      Edit
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <EmptyState title="No staff yet" body="Add a staff member to get started." />
        )}
      </CardShell>
      <div ref={panel} className="min-h-[520px]">
        <SidePanelForm
          title="Add / Edit Staff"
          submitLabel="Save"
          onSubmit={save}
          className="border-transparent"
        >
          <Field
            label="Name"
            value={draft.name}
            onChange={(value) => change("name", value)}
            error={errors.name}
          />
          <Field
            label="Phone"
            type="tel"
            value={draft.phone}
            onChange={(value) => change("phone", value)}
            error={errors.phone}
          />
          <Field
            label="Email"
            name="email"
            value={draft.email}
            onChange={(value) => change("email", value)}
            error={errors.email}
          />
          <Field
            label="Role"
            type="select"
            value={draft.role}
            options={data.roles.map((role) => ({ value: role, label: role }))}
            onChange={(value) => change("role", value)}
            error={errors.role}
          />
          <p role="status" className="text-body-small text-text-secondary">
            {notice}
          </p>
        </SidePanelForm>
      </div>
    </div>
  );
}
