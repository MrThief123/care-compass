"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { Field } from "@/components/shared/forms/field";
import { SidePanelForm } from "@/components/shared/forms/side-panel-form";
import { DataTable } from "@/components/shared/lists/data-table";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";
import { requiredPhoneError } from "@/lib/phone/au-phone";
import { cn } from "@/lib/utils";
import type { CarerAssignment } from "@/server/admin/assignments-queries";
import { createStaff, updateStaff } from "@/server/admin/staff-actions";
import type { AdminStaffData } from "@/server/admin/staff-queries";
import type { StaffMember } from "@/types/domain";

import { CarerAssignments } from "./carer-assignments";

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
      const message = requiredPhoneError(value);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
  email: z.string().trim().email("Enter a valid email address."),
  jobTitle: z.string(),
});

function fullName(person: Pick<StaffMember, "firstName" | "lastName">): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function StaffScreen({
  data,
  assignments = [],
}: {
  data: AdminStaffData;
  /** Every carer's clients (ADM-08); the selected carer's are listed in their panel. */
  assignments?: CarerAssignment[];
}) {
  const [staff, setStaff] = useState(() => data.staff.map((person) => ({ ...person })));
  // The side panel is closed until a name or Add Staff is pressed; `selectedId` null means adding.
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [notice, setNotice] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const selected = staff.find((person) => person.id === selectedId);

  useEffect(() => {
    if (open) panel.current?.querySelector("input")?.focus();
  }, [open, selectedId]);

  function edit(person?: StaffMember) {
    setSelectedId(person?.id ?? null);
    setDraft(person ? draftFrom(person) : emptyDraft());
    setErrors({});
    setNotice("");
    setOpen(true);
  }

  function close(message = "") {
    setOpen(false);
    setSelectedId(null);
    setDraft(emptyDraft());
    setErrors({});
    setNotice(message);
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
    close(fullName(saved) + " saved");
  }

  function change(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setNotice("");
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <div
      className={cn(
        "grid min-h-[calc(100vh-76px)] grid-cols-1 gap-5 p-6",
        open && "lg:grid-cols-[minmax(0,1fr)_360px]",
      )}
    >
      <CardShell className="min-w-0 border-transparent p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-card text-text-primary">Staff List</h2>
          <Button onClick={() => edit()}>
            <Icon name="plus" aria-hidden />
            Add Staff
          </Button>
        </div>
        {!open && (
          <p role="status" className="mb-3 text-body-small text-text-secondary">
            {notice}
          </p>
        )}
        {staff.length ? (
          <div className="overflow-x-auto">
            <DataTable
              className="min-w-[440px] [&_td]:py-1"
              rows={staff}
              rowKey={(person) => person.id}
              columns={[
                {
                  key: "name",
                  header: "Name",
                  render: (person) => (
                    <Button
                      variant="ghost"
                      aria-label={"Edit " + fullName(person)}
                      aria-current={open && selectedId === person.id ? "true" : undefined}
                      onClick={() => edit(person)}
                    >
                      {fullName(person)}
                    </Button>
                  ),
                },
                {
                  key: "role",
                  header: "Role",
                  render: (person) => (
                    <span className="text-text-secondary">{person.jobTitle}</span>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <EmptyState title="No staff yet" body="Add a staff member to get started." />
        )}
      </CardShell>
      {open && (
        <div
          className="flex min-w-0 flex-col gap-5"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !document.querySelector('[role="dialog"]')) close();
          }}
        >
          <div ref={panel} className="min-h-[520px]">
            <SidePanelForm
              title={selectedId ? "Edit Staff" : "Add Staff"}
              submitLabel="Save"
              onSubmit={save}
              onCancel={() => close()}
              cancelLabel="Close"
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
          {selected && (
            <CarerAssignments
              key={selected.id}
              carer={{ id: selected.id, name: fullName(selected) }}
              assignments={assignments}
              onRemoved={setNotice}
            />
          )}
        </div>
      )}
    </div>
  );
}
