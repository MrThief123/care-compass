import tokens from "./tokens.fixture.json";

export type ContrastPairKind = "body" | "non-body";

export interface ContrastPair {
  label: string;
  foreground: keyof typeof tokens;
  background: keyof typeof tokens;
  kind: ContrastPairKind;
}

/**
 * Approved text/background combinations (UI-§5.1). "body" pairs must clear the
 * WCAG AA 4.5:1 body-text threshold (AC-02); "non-body" pairs are large text,
 * icons or decorative chrome and are exempt from that check.
 */
export const approvedContrastPairs: ContrastPair[] = [
  {
    label: "primary text on surface",
    foreground: "text/primary",
    background: "bg/surface",
    kind: "body",
  },
  {
    label: "primary text on canvas",
    foreground: "text/primary",
    background: "bg/canvas",
    kind: "body",
  },
  {
    label: "secondary text on surface",
    foreground: "text/secondary",
    background: "bg/surface",
    kind: "body",
  },
  {
    label: "brand text on surface",
    foreground: "text/brand",
    background: "bg/surface",
    kind: "body",
  },
  {
    label: "alert-strong text on alert",
    foreground: "text/alert-strong",
    background: "bg/alert",
    kind: "body",
  },
  {
    label: "alert text on surface",
    foreground: "text/alert",
    background: "bg/surface",
    kind: "body",
  },
  {
    label: "on-dark text on brand-deep",
    foreground: "text/on-dark",
    background: "bg/brand-deep",
    kind: "body",
  },
  {
    label: "on-dark text on alert-strong",
    foreground: "text/on-dark",
    background: "bg/alert-strong",
    kind: "body",
  },
  {
    label: "muted text on surface",
    foreground: "text/muted",
    background: "bg/surface",
    kind: "non-body",
  },
];

export function tokenHex(name: keyof typeof tokens): string {
  return tokens[name];
}
