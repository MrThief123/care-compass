"use client";

import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod";

import { ConfirmationModal } from "@/components/shared/forms/confirmation-modal";
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
import {
  createStaff,
  deactivateStaff,
  resendStaffInvite,
  updateStaff,
} from "@/server/admin/staff-actions";
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

const DEACTIVATE_FAILED = "Couldn't deactivate. Please try again.";

function Tag({ children }: { children: string }) {
  return (
    <span className="ml-1 inline-flex items-center rounded-pill border border-bg-muted bg-bg-surface px-2 py-1 text-body-small font-medium text-text-secondary">
      {children}
    </span>
  );
}

function fullName(person: Pick<StaffMember, "firstName" | "lastName">): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

function StaffTable({
  rows,
  pendingIds,
  selectedId,
  onEdit,
}: {
  rows: StaffMember[];
  pendingIds: Set<string>;
  /** The person whose panel is open, if any. */
  selectedId: string | null;
  onEdit: (person: StaffMember, from: HTMLElement) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <DataTable
        className="min-w-[440px] [&_td]:py-1"
        rows={rows}
        rowKey={(person) => person.id}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (person) => (
              <>
                <Button
                  variant="ghost"
                  aria-label={"Edit " + fullName(person)}
                  aria-current={selectedId === person.id ? "true" : undefined}
                  className="h-auto min-h-11 whitespace-normal break-words text-left"
                  onClick={(event) => onEdit(person, event.currentTarget)}
                >
                  {fullName(person)}
                </Button>
                {!person.isActive && <Tag>Inactive</Tag>}
                {person.isActive && pendingIds.has(person.id) && <Tag>Pending</Tag>}
              </>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (person) => <span className="text-text-secondary">{person.jobTitle}</span>,
          },
        ]}
      />
    </div>
  );
}

export function StaffScreen({
  data,
  assignments = [],
}: {
  data: AdminStaffData;
  /** Every carer's clients (ADM-08); the selected carer's are listed in their panel. */
  assignments?: CarerAssignment[];
}) {
  // Invited carers who have not signed up yet; a carer added here is pending until a reload shows
  // otherwise (the server is the source of truth, `getAdminStaff().pendingIds`).
  const [pendingIds, setPendingIds] = useState(() => new Set(data.pendingIds ?? []));
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
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");
  const inactiveHeadingId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const addButton = useRef<HTMLSpanElement>(null);
  // The button that opened the panel, so closing it can give keyboard focus back (ADM-08 AC-11).
  const opener = useRef<HTMLElement | null>(null);
  const selected = staff.find((person) => person.id === selectedId);
  const activeStaff = staff.filter((person) => person.isActive);
  const inactiveStaff = staff.filter((person) => !person.isActive);

  useEffect(() => {
    if (open) panel.current?.querySelector("input")?.focus();
  }, [open, selectedId]);

  function edit(person?: StaffMember, from?: HTMLElement) {
    opener.current = from ?? null;
    setSelectedId(person?.id ?? null);
    setDraft(person ? draftFrom(person) : emptyDraft());
    setErrors({});
    setNotice("");
    setDeactivateError("");
    setOpen(true);
  }

  function close(message = "") {
    const back = opener.current?.isConnected
      ? opener.current
      : addButton.current?.querySelector("button");
    back?.focus();
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
    if (!selectedId) setPendingIds((current) => new Set(current).add(saved.id));
    close(fullName(saved) + (selectedId ? " saved" : " invited. Pending until they sign up."));
  }

  async function resendInvite() {
    if (!selectedId) return;
    const outcome = await resendStaffInvite(selectedId);
    setNotice(outcome.ok ? "Invite sent again." : outcome.error.message);
  }

  async function confirmDeactivation() {
    const target = selected;
    setConfirmDeactivate(false);
    if (!target) return;
    const outcome = await deactivateStaff(target.id);
    if (!outcome.ok) {
      setDeactivateError(outcome.error.message || DEACTIVATE_FAILED);
      return;
    }
    const saved = outcome.data;
    setStaff((current) => current.map((person) => (person.id === saved.id ? saved : person)));
    close(`${fullName(saved)} deactivated. Their future shifts were cancelled.`);
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
          <span ref={addButton}>
            <Button onClick={(event) => edit(undefined, event.currentTarget)}>
              <Icon name="plus" aria-hidden />
              Add Staff
            </Button>
          </span>
        </div>
        {!open && (
          <p role="status" className="mb-3 text-body-small text-text-secondary">
            {notice}
          </p>
        )}
        {staff.length ? (
          <>
            {activeStaff.length > 0 && (
              <StaffTable
                rows={activeStaff}
                pendingIds={pendingIds}
                selectedId={open ? selectedId : null}
                onEdit={edit}
              />
            )}
            {inactiveStaff.length > 0 && (
              <section aria-labelledby={inactiveHeadingId} className="mt-6 flex flex-col gap-2">
                <h3 id={inactiveHeadingId} className="text-title-card text-text-primary">
                  Inactive staff
                </h3>
                {
                  <StaffTable
                    rows={inactiveStaff}
                    pendingIds={pendingIds}
                    selectedId={open ? selectedId : null}
                    onEdit={edit}
                  />
                }
              </section>
            )}
          </>
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
              {selectedId && pendingIds.has(selectedId) && (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-body-small text-text-secondary">
                    Invite sent. Pending until they sign up.
                  </p>
                  <Button type="button" variant="secondary" onClick={resendInvite}>
                    Resend invite
                  </Button>
                </div>
              )}
              <p role="status" className="text-body-small text-text-secondary">
                {notice}
              </p>
            </SidePanelForm>
          </div>
          {selected?.isActive && (
            <CardShell className="border-transparent p-5">
              <div className="flex flex-col gap-3">
                {deactivateError && (
                  <p role="alert" className="text-body-small break-words text-destructive">
                    {deactivateError}
                  </p>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  className="h-auto min-h-11 whitespace-normal break-words"
                  onClick={() => {
                    setDeactivateError("");
                    setConfirmDeactivate(true);
                  }}
                >
                  Deactivate {fullName(selected)}
                </Button>
              </div>
            </CardShell>
          )}
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
      <ConfirmationModal
        open={confirmDeactivate}
        title="Deactivate staff member?"
        body={
          selected
            ? `${fullName(selected)} will lose access straight away. Their future shifts will be cancelled and any shift in progress will end now. Their records are kept.`
            : ""
        }
        confirmLabel="Deactivate"
        tone="destructive"
        onConfirm={() => void confirmDeactivation()}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </div>
  );
}
