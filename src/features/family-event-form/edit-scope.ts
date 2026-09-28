import type { ChipOption } from "@/components/shared/forms";

/**
 * PD-045's scope choice, for editing a recurring event. "future" ("This and
 * future") is not built — splitting a series (capping the old event and
 * starting a new one from the edited occurrence) is a real, undesigned
 * capability with no test coverage; see FAM-07 DECISIONS.md FD-01. It shows
 * disabled, not absent, since the choice is a human-confirmed decision
 * (PD-045), not a permission — hiding it would look like it was never
 * planned.
 */
export type EditScope = "occurrence" | "series";

export const EDIT_SCOPE_OPTIONS: ChipOption[] = [
  { value: "occurrence", label: "This occurrence" },
  { value: "series", label: "Entire series" },
  { value: "future", label: "This and future", disabled: true },
];
