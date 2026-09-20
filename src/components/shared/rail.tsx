import type { Role } from "@/types/domain";

import { ROLE_LABEL } from "./nav-config";
import { RailNav } from "./rail-nav";

export interface RailProps {
  role: Role;
  /** The role's route root, e.g. `/family/client-margaret`, `/carer`, `/admin`. */
  basePath: string;
}

/**
 * Persistent 88px navigation rail (F0-15 PRD.md Scope). One instance per
 * role layout; nav contents come from `nav-config.ts`.
 *
 * Sticky at the top of the viewport so the buttons stay in view while a long
 * screen scrolls. It scrolls inside itself on a window too short to show every
 * button, rather than clipping the last ones out of reach.
 */
export function Rail({ role, basePath }: RailProps) {
  return (
    <aside
      aria-label={`${ROLE_LABEL[role]} navigation`}
      className="sticky top-0 flex h-screen w-[88px] shrink-0 flex-col items-center gap-5 self-start overflow-y-auto overflow-x-hidden bg-rail-gradient pt-6"
    >
      <p className="w-full text-center text-label-caps text-text-on-dark">{ROLE_LABEL[role]}</p>
      <RailNav role={role} basePath={basePath} />
    </aside>
  );
}
