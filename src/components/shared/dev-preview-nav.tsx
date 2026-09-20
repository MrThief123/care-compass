"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "../ui/button";

const navigation = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "UI-01",
    href: "/dev-preview-calendar-kit",
  },
  {
    label: "UI-02",
    href: "/dev-preview-forms-kit",
  },
  {
    label: "Database",
    href: "/dev-preview-database",
  },
];

export function DevPreviewNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 border-b border-border-default p-4">
      {navigation.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? "primary" : "secondary"}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}