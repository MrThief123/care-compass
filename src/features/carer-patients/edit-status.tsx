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

/**
 * Off-shift notice above a patient screen (CHG-029): explains why the edit controls are absent.
 * `info` is the Info tab; `tasks` is Home, Calendar and Care log, where ticking happens only in
 * the Calendar's Tasks panel while a shift is in progress (CHG-026).
 */
export function ViewOnlyNotice({
  firstName,
  purpose = "info",
}: {
  firstName: string;
  purpose?: "info" | "tasks";
}) {
  return (
    <div
      role="note"
      className="mx-6 mt-5 flex items-start gap-2 rounded-card border border-border-default bg-bg-inset px-4 py-3 text-sm text-text-primary"
    >
      <Icon name="info" size={16} aria-hidden className="mt-0.5 shrink-0" />
      <p>
        <span className="font-semibold">View only.</span>{" "}
        {purpose === "info"
          ? `You can edit ${firstName}'s information once your shift with them starts.`
          : `You can tick off ${firstName}'s tasks from the Calendar once your shift with them starts.`}
      </p>
    </div>
  );
}
