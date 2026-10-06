import Link from "next/link";

import { InfoTip } from "@/components/ui/info-tip";
import { HELP_TEXT } from "@/features/family-help/help-text";

import { homeRoutes } from "./home-routes";

export interface EnterEventLinkProps {
  clientId: string;
  basePath?: string;
  /** Family only (FAM-17): an info tip beside the link. */
  showHelp?: boolean;
}

/**
 * The right column's primary action. It navigates, so it is a link styled as
 * the kit's primary Button (which renders a `<button>` and cannot wrap a link;
 * see DECISIONS.md FD-05). 52px tall to match the design.
 */
export function EnterEventLink({ clientId, basePath, showHelp = false }: EnterEventLinkProps) {
  const link = (
    <Link
      href={homeRoutes.newEvent(clientId, basePath)}
      className="inline-flex h-13 w-full items-center justify-center rounded-control bg-primary text-title-card text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      Enter event
    </Link>
  );
  if (!showHelp) return link;
  return (
    <div className="flex items-center gap-1">
      <div className="min-w-0 flex-1">{link}</div>
      <InfoTip label={HELP_TEXT.enterEvent.label} text={HELP_TEXT.enterEvent.text} />
    </div>
  );
}
