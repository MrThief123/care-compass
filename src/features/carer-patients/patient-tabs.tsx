"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { segment: "home", label: "Home" },
  { segment: "info", label: "Info" },
  { segment: "calendar", label: "Calendar" },
  { segment: "tasks", label: "Care log" },
] as const;

/** The patient's screens (CHG-028). Budget and Settings are family-only (CHG-026). */
export function PatientTabs({ clientId, firstName }: { clientId: string; firstName: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={`${firstName}'s pages`} className="flex flex-wrap gap-1">
      {TABS.map(({ segment, label }) => {
        const href = `/carer/patients/${clientId}/${segment}`;
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={segment}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center border-b-2 px-4 text-body-emphasis focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              current
                ? "border-border-brand text-text-brand"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
