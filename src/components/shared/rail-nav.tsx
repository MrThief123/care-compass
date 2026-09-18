"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/domain";

import { isSegmentActive, RAIL_NAV_ITEMS } from "./nav-config";

export interface RailNavProps {
  role: Role;
  basePath: string;
}

/**
 * The rail's interactive nav list. Isolated as its own small client
 * component so only active-state detection (`usePathname`) crosses the
 * client boundary — `Rail` itself stays a Server Component (PRD.md F0-15
 * Technical Considerations).
 */
export function RailNav({ role, basePath }: RailNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex w-full flex-col gap-1 px-2">
      {RAIL_NAV_ITEMS[role].map((item) => {
        const active = isSegmentActive(pathname, basePath, item.segment);
        return (
          <Link
            key={item.segment}
            href={`${basePath}/${item.segment}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 rounded-control py-3 text-label-caps",
              active ? "bg-bg-surface text-text-brand" : "text-text-on-dark hover:bg-white/10",
            )}
          >
            <Icon name={item.icon} size={24} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
