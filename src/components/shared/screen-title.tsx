"use client";

import { usePathname } from "next/navigation";

import { RAIL_NAV_ITEMS } from "./nav-config";

export interface ScreenTitleProps {
  role: "carer" | "admin";
  basePath: string;
}

/**
 * Carer/Admin `PageHeader` subject: the active rail item's label (PRD.md
 * F0-15 Scope: "Carer/Admin → screen name"). Small client component so
 * only this piece needs `usePathname`.
 */
export function ScreenTitle({ role, basePath }: ScreenTitleProps) {
  const pathname = usePathname();
  const items = RAIL_NAV_ITEMS[role];
  const active = items.find(
    (item) =>
      pathname === `${basePath}/${item.segment}` ||
      pathname.startsWith(`${basePath}/${item.segment}/`),
  );

  return <p className="text-title-page text-text-primary">{(active ?? items[0])?.label}</p>;
}
