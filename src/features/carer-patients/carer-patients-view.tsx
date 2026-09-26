"use client";

import Link from "next/link";
import { useState } from "react";

import { PersonCard } from "@/components/shared/cards/person-card";
import { SearchField } from "@/components/shared/search-field";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { CarerPatientRow } from "@/server/shifts/queries";

import { EditStatusBadge } from "./edit-status";
import { patientMeta } from "./patient-meta";

/**
 * Carer · Patients (CAR-UI-02): a card per patient, soonest shift first
 * (FD-03), filtered by first name as the carer types. Search is local state
 * only and resets on reload.
 */
export function CarerPatientsView({ patients }: { patients: CarerPatientRow[] }) {
  const [query, setQuery] = useState("");

  if (patients.length === 0) {
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

  const needle = query.trim().toLowerCase();
  const shown = patients.filter((p) => p.firstName.toLowerCase().includes(needle));

  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <SearchField
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        placeholder="Search patients"
        noResultsFor={shown.length === 0 ? query : undefined}
      />
      {shown.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((patient) => (
            <li key={patient.clientId} className="min-w-0">
              <Link
                href={`/carer/patients/${patient.clientId}`}
                className="relative block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>div]:hover:bg-bg-inset"
              >
                <PersonCard
                  name={patient.firstName}
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
