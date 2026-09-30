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
import { australianPhoneError } from "@/lib/phone/au-phone";
import { createStaff, updateStaff } from "@/server/admin/staff-actions";
import type { AdminStaffData } from "@/server/admin/staff-queries";
import type { StaffMember } from "@/types/domain";

interface Draft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  jobTitle: string;
}

const DraftSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.string().trim().min(1, "Enter a last name."),
  phone: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = australianPhoneError(value);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
  email: z.string().trim().email("Enter a valid email address."),
  jobTitle: z.string(),
});

function fullName(person: Pick<StaffMember, "firstName" | "lastName">): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function StaffScreen({ data }: { data: AdminStaffData }) {
  const [staff, setStaff] = useState(() => data.staff.map((person) => ({ ...person })));
  const [selectedId, setSelectedId] = useState<string | null>(data.staff[0]?.id ?? null);
  const emptyDraft = (): Draft => ({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    jobTitle: data.roles[0] ?? "",
  });
  const draftFrom = (person: StaffMember): Draft => ({
    firstName: person.firstName,
    lastName: person.lastName,
    phone: person.phone ?? "",
    email: person.email,
    jobTitle: person.jobTitle,
  });
  const [draft, setDraft] = useState<Draft>(() =>
    data.staff[0] ? draftFrom(data.staff[0]) : emptyDraft(),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [notice, setNotice] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  function edit(person?: StaffMember) {
    setSelectedId(person?.id ?? null);
    setDraft(person ? draftFrom(person) : emptyDraft());
    setErrors({});
    setNotice("");
    panel.current?.querySelector("input")?.focus();
  }

  async function save() {
    const result = DraftSchema.refine((value) => data.roles.includes(value.jobTitle), {
      message: "Choose a role.",
      path: ["jobTitle"],
    }).safeParse(draft);
    if (!result.success) {
      const nextErrors: Partial<Record<keyof Draft, string>> = {};
      for (const issue of result.error.issues)
        nextErrors[issue.path[0] as keyof Draft] = issue.message;
      setErrors(nextErrors);
      setNotice("");
      return;
    }

    const outcome = selectedId
      ? await updateStaff(selectedId, result.data)
      : await createStaff(result.data);
    if (!outcome.ok) {
      if (outcome.error.code === "VALIDATION") {
        setErrors({ email: outcome.error.message });
      } else {
        setNotice(outcome.error.message);
      }
      return;
    }
    const saved = outcome.data;
    setStaff((current) =>
      selectedId
        ? current.map((person) => (person.id === selectedId ? saved : person))
        : [...current, saved],
    );
    setSelectedId(saved.id);
    setDraft(draftFrom(saved));
    setErrors({});
    setNotice(fullName(saved) + " saved");
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
                { key: "name", header: "Name", render: (person) => fullName(person) },
                {
                  key: "role",
                  header: "Role",
                  render: (person) => (
                    <span className="text-text-secondary">{person.jobTitle}</span>
                  ),
                },
                {
                  key: "edit",
                  header: "Edit",
                  render: (person) => (
                    <Button
                      variant="ghost"
                      aria-label={"Edit " + fullName(person)}
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
            label="First name"
            value={draft.firstName}
            onChange={(value) => change("firstName", value)}
            error={errors.firstName}
          />
          <Field
            label="Last name"
            value={draft.lastName}
            onChange={(value) => change("lastName", value)}
            error={errors.lastName}
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
            value={draft.jobTitle}
            options={data.roles.map((role) => ({ value: role, label: role }))}
            onChange={(value) => change("jobTitle", value)}
            error={errors.jobTitle}
          />
          <p role="status" className="text-body-small text-text-secondary">
            {notice}
          </p>
        </SidePanelForm>
      </div>
    </div>
  );
}
