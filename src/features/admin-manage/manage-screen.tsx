"use client";

import { useState } from "react";
import { z } from "zod";

import { DatePickerGrid } from "@/components/shared/calendar/date-picker-grid";
import { ChipGroup } from "@/components/shared/forms/chip-group";
import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { SelectableListRow } from "@/components/shared/lists/selectable-list-row";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";
import type { AdminManageData, ManagePerson } from "@/server/admin/manage-queries";

const slots = [
  { value: "07:00/11:00", label: "07:00 - 11:00" },
  { value: "11:00/15:00", label: "11:00 - 15:00" },
  { value: "15:00/19:00", label: "15:00 - 19:00" },
  { value: "custom", label: "Custom" },
];
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time as HH:MM.");
const timeRange = z.object({ start: time, end: time }).refine(({ start, end }) => end > start, {
  message: "End time must be after start time.",
  path: ["end"],
});

function PersonList({
  title,
  people,
  selected,
  onSelect,
}: {
  title: "Staff" | "Clients";
  people: ManagePerson[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = people.filter((person) =>
    person.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const label = title.toLowerCase();
  return (
    <CardShell className="min-w-0 space-y-3 border-transparent p-4">
      <h2 id={`manage-${label}`} className="text-title-section text-text-primary">
        {title}
      </h2>
      <label className="flex h-11 items-center gap-2 rounded-control border border-border-brand px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
        <Icon name="search" size={20} aria-hidden className="shrink-0 text-text-secondary" />
        <span className="sr-only">Search {label}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${label}`}
          className="min-w-0 w-full bg-transparent text-body-default text-text-primary outline-none placeholder:text-text-secondary"
        />
      </label>
      {matches.length ? (
        <div
          role="listbox"
          aria-labelledby={`manage-${label}`}
          className="space-y-1"
          onKeyDown={(event) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
            const options = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'),
            );
            const index = options.indexOf(event.target as HTMLButtonElement);
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
                    options.length;
            event.preventDefault();
            options[next]?.focus();
            options[next]?.click();
          }}
        >
          {matches.map((person) => (
            <SelectableListRow
              key={person.id}
              name={person.name}
              selected={selected === person.id}
              onClick={() => onSelect(person.id)}
              className="min-h-12 [&>span:nth-child(2)]:whitespace-normal [&>span:nth-child(2)]:break-words"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title={people.length ? `No ${label} found` : `No ${label} available`}
          body={people.length ? "Try a different name." : `There are no ${label} in this preview.`}
        />
      )}
    </CardShell>
  );
}

export function ManageScreen({ data }: { data: AdminManageData }) {
  const [staffId, setStaffId] = useState(data.staff[0]?.id ?? "");
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? "");
  const [date, setDate] = useState(data.referenceDate);
  const [month, setMonth] = useState(data.referenceDate);
  const [slot, setSlot] = useState("07:00/11:00");
  const [custom, setCustom] = useState({ start: "", end: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [shifts, setShifts] = useState(data.shifts);
  const staff = data.staff.find((person) => person.id === staffId);
  const client = data.clients.find((person) => person.id === clientId);
  const [presetStart = "", presetEnd = ""] = slot.split("/");
  const range = slot === "custom" ? custom : { start: presetStart, end: presetEnd };
  const validRange = timeRange.safeParse(range);
  const overlaps = validRange.success
    ? shifts.filter(
        (shift) =>
          shift.staffId === staffId &&
          shift.date === date &&
          range.start < shift.end &&
          range.end > shift.start,
      )
    : [];

  function clear() {
    setStaffId("");
    setClientId("");
    setNotice("");
    setErrors({});
  }
  function cancel() {
    clear();
    setDate(data.referenceDate);
    setMonth(data.referenceDate);
    setSlot("07:00/11:00");
    setCustom({ start: "", end: "" });
  }
  function changeMonth(offset: number) {
    const [year = 2026, monthNumber = 11] = month.split("-").map(Number);
    const next = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
    setMonth(next.toISOString().slice(0, 10));
  }
  function assign() {
    if (!staff || !client) return;
    if (!validRange.success) {
      setErrors(
        Object.fromEntries(
          validRange.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    setShifts((previous) => [
      ...previous,
      { id: `local-${previous.length}`, staffId, clientId, date, ...validRange.data },
    ]);
    setNotice(
      `Shift assigned: ${staff.name} → ${client.name}, ${date}, ${range.start} - ${range.end}.`,
    );
  }
  return (
    <div className="grid gap-5 p-6 lg:grid-cols-[240px_240px_minmax(0,1fr)] xl:grid-cols-[290px_290px_minmax(0,1fr)] lg:min-h-[calc(100vh-76px)]">
      <PersonList
        title="Staff"
        people={data.staff}
        selected={staffId}
        onSelect={(id) => {
          setStaffId(id);
          setNotice("");
        }}
      />
      <PersonList
        title="Clients"
        people={data.clients}
        selected={clientId}
        onSelect={(id) => {
          setClientId(id);
          setNotice("");
        }}
      />
      <CardShell className="flex min-w-0 flex-col gap-5 border-transparent p-5">
        <h2 className="text-title-section text-text-primary">Assign shift</h2>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-inset bg-bg-inset p-3">
          <p className="min-w-0 break-words text-body-emphasis text-text-primary">
            {staff && client
              ? `${staff.name} → ${client.name}`
              : "Select a staff member and client"}
          </p>
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
        </div>
        <section aria-label="Shift date" className="space-y-3 overflow-x-auto">
          <h3 className="text-body-emphasis text-text-primary">Date</h3>
          <DatePickerGrid
            month={month}
            selected={date}
            datesWithItems={shifts
              .filter((shift) => shift.staffId === staffId)
              .map((shift) => shift.date)}
            onSelect={(value) => {
              setDate(value);
              setMonth(value);
              setNotice("");
            }}
            onPrevMonth={() => changeMonth(-1)}
            onNextMonth={() => changeMonth(1)}
            className="min-w-[332px] max-w-[336px] [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:justify-center"
          />
        </section>
        <ChipGroup
          legend="Time slot"
          options={slots}
          value={slot}
          onChange={(value) => {
            setSlot(value);
            setErrors({});
            setNotice("");
          }}
        />
        {slot === "custom" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Start time"
              value={custom.start}
              placeholder="HH:MM"
              hint="24-hour Melbourne time"
              error={errors.start}
              onChange={(start) => {
                setCustom({ ...custom, start });
                setErrors({});
                setNotice("");
              }}
            />
            <Field
              label="End time"
              value={custom.end}
              placeholder="HH:MM"
              error={errors.end}
              onChange={(end) => {
                setCustom({ ...custom, end });
                setErrors({});
                setNotice("");
              }}
            />
          </div>
        )}
        {staff && overlaps.length > 0 && (
          <InlineAlert>
            {overlaps
              .map(
                (shift) =>
                  `${staff.name} already has a shift with ${data.clients.find((person) => person.id === shift.clientId)?.name ?? "another client"} from ${shift.start} - ${shift.end} that overlaps this time.`,
              )
              .join(" ")}{" "}
            You can still assign it.
          </InlineAlert>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-inset bg-bg-inset p-3 text-body-default text-text-brand"
          >
            {notice}
          </p>
        )}
        <div className="mt-auto space-y-3 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={cancel}>
              Cancel
            </Button>
            <Button onClick={assign} disabled={!staff || !client}>
              Assign shift
            </Button>
          </div>
        </div>
      </CardShell>
    </div>
  );
}
