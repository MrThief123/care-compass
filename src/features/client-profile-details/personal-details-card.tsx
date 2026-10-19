import Link from "next/link";
import { useId } from "react";

import { CardShell } from "@/components/ui/card-shell";
import { ageFromDob } from "@/lib/format/age";
import type { ClientDetails } from "@/server/clients/client-details-schema";

const BORN_FORMAT = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  // The date of birth is a calendar date: read it as written, not shifted to a time zone.
  timeZone: "UTC",
});

function rows(details: ClientDetails): Array<{ term: string; value: string }> {
  const {
    dateOfBirth,
    email,
    phone,
    address,
    suburb,
    emergencyContactName,
    emergencyContactRelationship,
    emergencyContactPhone,
  } = details;
  const emergencyName = [
    emergencyContactName,
    emergencyContactRelationship && `(${emergencyContactRelationship})`,
  ]
    .filter(Boolean)
    .join(" ");
  const entries: Array<[string, string]> = [
    [
      "Age",
      dateOfBirth
        ? `${ageFromDob(dateOfBirth)} (born ${BORN_FORMAT.format(new Date(`${dateOfBirth}T00:00:00Z`))})`
        : "",
    ],
    ["Email", email ?? ""],
    ["Phone", phone ?? ""],
    ["Address", [address, suburb].filter(Boolean).join(", ")],
    ["Emergency contact", [emergencyName, emergencyContactPhone].filter(Boolean).join(" · ")],
  ];
  return entries.filter(([, value]) => value !== "").map(([term, value]) => ({ term, value }));
}

export interface PersonalDetailsCardProps {
  details: ClientDetails;
  /** Family only: where the details are edited. No link for a carer or an admin. */
  settingsHref?: string;
}

/**
 * F0-28 'Personal details' at the top of Client Details (Family, Carer, Admin): age with the
 * date of birth, the client's email and phone, address and emergency contact. Read-only for
 * everyone; the family edits them in Settings. A field that is not set is left out.
 */
export function PersonalDetailsCard({ details, settingsHref }: PersonalDetailsCardProps) {
  const headingId = useId();
  const items = rows(details);

  return (
    <CardShell role="region" aria-labelledby={headingId} className="flex flex-col gap-2.5 p-3.75">
      <div className="flex min-h-11 items-center">
        <h2 id={headingId} className="text-title-card text-text-primary">
          Personal details
        </h2>
      </div>
      {items.length > 0 ? (
        <dl className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-body-default">
          {items.map(({ term, value }) => (
            <div key={term} className="contents">
              <dt className="text-text-secondary">{term}</dt>
              <dd className="text-text-primary [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-body-default text-text-secondary">
          No personal details added yet.
          {settingsHref && (
            <>
              {" "}
              <Link href={settingsHref} className="text-text-brand underline">
                Add them in Settings
              </Link>
              .
            </>
          )}
        </p>
      )}
    </CardShell>
  );
}
