/**
 * The words on every Family info tip (FAM-17 FD-03): one sentence, at most 100
 * characters, in plain language. `label` is what the button beside it is called.
 * Keep the wording here, not in the screens, so it can be reviewed in one place.
 */
export interface HelpEntry {
  label: string;
  text: string;
}

export const HELP_TEXT = {
  enterEvent: {
    label: "Enter event",
    text: "Add a care event, one-off or repeating, for the person you care for.",
  },
  editBudget: {
    label: "Edit",
    text: "Change the funding sources and amounts that pay for care.",
  },
  exportHistory: {
    label: "Export",
    text: "Download this fund history as a spreadsheet file (CSV).",
  },
} as const satisfies Record<string, HelpEntry>;
