import Link from "next/link";

import { homeRoutes } from "./home-routes";

export interface EnterEventLinkProps {
  clientId: string;
}

/**
 * The right column's primary action. It navigates, so it is a link styled as
 * the kit's primary Button (which renders a `<button>` and cannot wrap a link;
 * see DECISIONS.md FD-05). 52px tall to match the design.
 */
export function EnterEventLink({ clientId }: EnterEventLinkProps) {
  return (
    <Link
      href={homeRoutes.newEvent(clientId)}
      className="inline-flex h-13 w-full items-center justify-center rounded-control bg-primary text-title-card text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      Enter event
    </Link>
  );
}
