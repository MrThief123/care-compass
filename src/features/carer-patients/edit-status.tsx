import { Icon } from "@/components/ui/icon";

/** Patients card label (CHG-029): whether the carer can edit this patient right now, in text. */
export function EditStatusBadge({ onShift }: { onShift: boolean }) {
  return onShift ? (
    <span className="inline-flex items-center gap-1 rounded-pill border border-border-brand bg-bg-brand-pale px-2 py-0.5 text-xs font-medium text-text-brand">
      <Icon name="check" size={16} aria-hidden />
      On shift · can edit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-pill border border-border-default bg-bg-inset px-2 py-0.5 text-xs font-medium text-text-secondary">
      <Icon name="info" size={16} aria-hidden />
      View only
    </span>
  );
}

/** Off-shift notice above patient Info (CHG-029): explains why the edit controls are absent. */
export function ViewOnlyNotice({ firstName }: { firstName: string }) {
  return (
    <div
      role="note"
      className="mx-6 mt-5 flex items-start gap-2 rounded-card border border-border-default bg-bg-inset px-4 py-3 text-sm text-text-primary"
    >
      <Icon name="info" size={16} aria-hidden className="mt-0.5 shrink-0" />
      <p>
        <span className="font-semibold">View only.</span> You can edit {firstName}&apos;s
        information once your shift with them starts.
      </p>
    </div>
  );
}
