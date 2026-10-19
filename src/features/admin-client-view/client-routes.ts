/** The admin's client view lives under `/admin/clients/<clientId>` (ADM-11). */
export function adminClientBase(clientId: string): string {
  return `/admin/clients/${encodeURIComponent(clientId)}`;
}

export type AdminClientScreen = { label: string; href: string };

/** The Family screens an admin can open for a client, in nav order. Care log is `tasks` (FD-04). */
export function adminClientScreens(clientId: string): AdminClientScreen[] {
  const base = adminClientBase(clientId);
  return [
    { label: "Home", href: `${base}/home` },
    { label: "Client Details", href: `${base}/info` },
    { label: "Calendar", href: `${base}/calendar` },
    { label: "Budget", href: `${base}/budget` },
    { label: "Care log", href: `${base}/tasks` },
  ];
}
