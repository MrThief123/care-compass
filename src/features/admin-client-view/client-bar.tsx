"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import { adminClientScreens } from "./client-routes";

/**
 * The bar above a client's Family screens: who the client is, a way back to the Clients list and
 * the five screens (ADM-11 FD-05, undesigned, PD-052). Tokens only, 44px targets, wraps when narrow.
 */
export function ClientBar({ clientId, clientName }: { clientId: string; clientName: string }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-3 border-b border-border-default bg-bg-surface px-6 pt-4">
      <Link
        href="/admin/clients"
        className="flex min-h-11 w-fit items-center gap-1 rounded-control text-body-default text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Icon name="chevron-left" size={16} aria-hidden />
        Back to clients
      </Link>
      <p className="min-w-0 break-words text-title-card text-text-primary [overflow-wrap:anywhere]">
        {clientName}
      </p>
      <nav aria-label="Client screens" className="flex flex-wrap gap-1">
        {adminClientScreens(clientId).map(({ label, href }) => {
          const current = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
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
    </div>
  );
}
