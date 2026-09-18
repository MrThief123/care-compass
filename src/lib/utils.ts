import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The type ramp declared with `@utility` in `src/styles/tokens.css`.
 *
 * tailwind-merge only knows Tailwind's own utilities. It reads `text-body-small`
 * as a text *colour*, so any `text-<colour>` in the same `cn` call silently
 * deleted it along with its font size, line height and weight — leaving the
 * element on the inherited body type. Registering the ramp as font sizes puts
 * each token in the group it belongs to: it no longer collides with a colour,
 * and it still resolves against another size, including Tailwind's own.
 */
const TYPE_TOKENS = [
  "title-page",
  "title-section",
  "title-card",
  "metric-large",
  "metric-medium",
  "body-emphasis",
  "body-default",
  "body-small",
  "body-secondary",
  "label-caps",
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: TYPE_TOKENS }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
