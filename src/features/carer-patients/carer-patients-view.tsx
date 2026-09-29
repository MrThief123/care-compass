"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PersonCard } from "@/components/shared/cards/person-card";
import { SearchField } from "@/components/shared/search-field";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { CarerPatientRow } from "@/server/shifts/queries";

import { EditStatusBadge } from "./edit-status";
import { patientMeta } from "./patient-meta";

/** How long typing must pause before the search is put in the URL. */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Carer · Patients: a card per patient, soonest shift first (FD-03). Search is
 * the URL's `?q=`, answered by the server (CAR-03 FD-01); this view shows what
 * it is given and moves the URL, as Family's Task log does.
 */
export function CarerPatientsView({
  patients,
  query,
}: {
  patients: CarerPatientRow[];
  /** The URL's search, already cleaned by the page. */
  query: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function go(value: string) {
    clearTimeout(timer.current);
    const q = value.trim();
    if (q === query) return;
    router.replace(q ? `/carer/patients?q=${encodeURIComponent(q)}` : "/carer/patients", {
      scroll: false,
    });
  }

  if (patients.length === 0 && query === "") {
    return (
      <div className="px-6 py-5">
        <CardShell>
          <EmptyState
            icon="person"
            title="No patients assigned yet"
            body="Patients appear here once you have a shift with them."
          />
        </CardShell>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <form
        role="search"
        aria-label="Search patients"
        onSubmit={(event) => {
          event.preventDefault();
          go(draft);
        }}
      >
        <SearchField
          value={draft}
          onChange={(value) => {
            setDraft(value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => go(value), SEARCH_DEBOUNCE_MS);
          }}
          onClear={() => {
            setDraft("");
            go("");
          }}
          placeholder="Search patients"
          noResultsFor={patients.length === 0 ? query : undefined}
        />
      </form>
      {patients.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {patients.map((patient) => (
            <li key={patient.clientId} className="min-w-0">
              <Link
                href={`/carer/patients/${patient.clientId}`}
                className="relative block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>div]:hover:bg-bg-inset"
              >
                <PersonCard
                  name={patient.name}
                  meta={patientMeta(patient)}
                  className="min-h-56 justify-center break-words"
                />
                <span className="absolute top-3 right-3">
                  <EditStatusBadge onShift={patient.onShift} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
