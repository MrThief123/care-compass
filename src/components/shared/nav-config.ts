/**
 * Rail navigation contents per role (F0-15 PRD.md Scope: "Family items:
 * Home · Info · Calendar · Budget · Settings. Carer: Home · Patients ·
 * Calendar · Settings. Admin: Home · Manage · Staff · Clients ·
 * Settings."). The single source both `Rail` (nav list) and `ScreenTitle`
 * (header screen name derived from the route) read from.
 */
import type { IconName } from "@/components/ui/icon";
import type { Role } from "@/types/domain";

export interface RailNavItemConfig {
  segment: string;
  label: string;
  icon: IconName;
}

export const RAIL_NAV_ITEMS: Record<Role, RailNavItemConfig[]> = {
  family: [
    { segment: "home", label: "Home", icon: "home" },
    { segment: "info", label: "Info", icon: "info" },
    { segment: "calendar", label: "Calendar", icon: "calendar" },
    { segment: "budget", label: "Budget", icon: "dollar" },
    { segment: "settings", label: "Settings", icon: "sliders" },
  ],
  carer: [
    { segment: "home", label: "Home", icon: "home" },
    { segment: "patients", label: "Patients", icon: "person" },
    { segment: "calendar", label: "Calendar", icon: "calendar" },
    { segment: "settings", label: "Settings", icon: "sliders" },
  ],
  admin: [
    { segment: "home", label: "Home", icon: "home" },
    { segment: "manage", label: "Manage", icon: "clipboard-check" },
    { segment: "staff", label: "Staff", icon: "person" },
    { segment: "clients", label: "Clients", icon: "info" },
    { segment: "settings", label: "Settings", icon: "sliders" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  family: "FAMILY",
  carer: "CARER",
  admin: "ADMIN",
};

/** A segment is active on its own route and any route nested under it. */
export function isSegmentActive(pathname: string, basePath: string, segment: string): boolean {
  const href = `${basePath}/${segment}`;
  return pathname === href || pathname.startsWith(`${href}/`);
}
