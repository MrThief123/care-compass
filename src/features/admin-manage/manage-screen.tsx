"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { DatePickerGrid } from "@/components/shared/calendar/date-picker-grid";
import { ConfirmationModal } from "@/components/shared/forms/confirmation-modal";
import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { SelectableListRow } from "@/components/shared/lists/selectable-list-row";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { shiftTimeRangeSchema } from "@/server/admin/assign-shift-schema";
import { assignShift, cancelShift } from "@/server/admin/manage-actions";
import type { AdminManageData, ManagePerson, ManageShift } from "@/server/admin/manage-queries";

/** Common shift times, one tap fills the start and end dropdowns. */
const commonShifts = [
  { start: "07:00", end: "11:00" },
  { start: "11:00", end: "15:00" },
  { start: "15:00", end: "19:00" },
  { start: "08:00", end: "16:00" },
  { start: "09:00", end: "17:00" },
];
const pad = (n: number) => String(n).padStart(2, "0");
const hourOptions = Array.from({ length: 24 }, (_, hour) => ({
  value: pad(hour),
  label: pad(hour),
}));
const minuteOptions = Array.from({ length: 12 }, (_, step) => ({
  value: pad(step * 5),
  label: pad(step * 5),
}));
const ASSIGN_FAILED = "Couldn't assign the shift. Try again.";
const CANCEL_FAILED = "Couldn't cancel the shift. Try again.";

function PersonList({
  title,
  people,
  selected,
  search,
  onSelect,
  onSearch,
}: {
  title: "Staff" | "Clients";
  people: ManagePerson[];
  selected: string;
  search: string;
  onSelect: (id: string) => void;
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState(search);
  const label = title.toLowerCase();
  return (
    <CardShell className="min-w-0 space-y-3 border-transparent p-4">
      <h2 id={`manage-${label}`} className="text-title-section text-text-primary">
        {title}
      </h2>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(query.trim());
        }}
      >
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
      </form>
      {people.length ? (
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
          {people.map((person) => (
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
          title={search ? `No ${label} found` : `No ${label} available`}
          body={search ? "Try a different name." : `There are no ${label} to show.`}
        />
      )}
    </CardShell>
  );
}

export interface ManageSelection {
  staffId: string;
  clientId: string;
}

export function ManageScreen({
  data,
  selection = { staffId: "", clientId: "" },
  staffSearch = "",
  clientSearch = "",
}: {
  data: AdminManageData;
  selection?: ManageSelection;
  staffSearch?: string;
  clientSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { staffId, clientId } = selection;
  const [date, setDate] = useState(data.referenceDate);
  const [month, setMonth] = useState(data.referenceDate);
  const [start, setStart] = useState("07:00");
  const [end, setEnd] = useState("11:00");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const [saving, setSaving] = useState(false);
  const [shifts, setShifts] = useState(data.shifts);
  const [justAssignedId, setJustAssignedId] = useState("");
  const [cancelling, setCancelling] = useState<ManageShift | null>(null);
  const staff = data.staff.find((person) => person.id === staffId);
  const client = data.clients.find((person) => person.id === clientId);
  const carerNameOf = (shift: ManageShift) =>
    shift.staffName ?? data.staff.find((person) => person.id === shift.staffId)?.name ?? "Carer";
  const clientNameOf = (shift: ManageShift) =>
    shift.clientName ??
    data.clients.find((person) => person.id === shift.clientId)?.name ??
    "Another client";
  const range = { start, end };
  const validRange = shiftTimeRangeSchema.safeParse(range);
  const overlaps = validRange.success
    ? shifts.filter(
        (shift) =>
          !(notice && shift.id === justAssignedId) &&
          shift.staffId === staffId &&
          shift.date === date &&
          range.start < shift.end &&
          range.end > shift.start,
      )
    : [];

  /** The URL is the single source of truth for selection and search (FD-02). */
  function updateUrl(changes: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }
  function clear() {
    updateUrl({ staff: "", client: "" });
    setNotice("");
    setFailure("");
    setErrors({});
  }
  function cancel() {
    clear();
    setDate(data.referenceDate);
    setMonth(data.referenceDate);
    setStart("07:00");
    setEnd("11:00");
  }
  function changeMonth(offset: number) {
    const [year = 2026, monthNumber = 11] = month.split("-").map(Number);
    const next = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
    setMonth(next.toISOString().slice(0, 10));
  }
  async function assign() {
    if (!staff || !client || saving) return;
    setFailure("");
    if (!validRange.success) {
      setErrors(
        Object.fromEntries(
          validRange.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    setNotice("");
    setSaving(true);
    let outcome: Awaited<ReturnType<typeof assignShift>>;
    try {
      outcome = await assignShift({ carerId: staffId, clientId, date, ...validRange.data });
    } catch {
      // A rejected action is a failed assignment, not a crash; the form stays as it was.
      outcome = { ok: false, error: { code: "UNEXPECTED", message: ASSIGN_FAILED } };
    }
    setSaving(false);
    if (!outcome.ok) {
      const messages = outcome.error.fieldErrors;
      if (messages && Object.keys(messages).length > 0) setErrors(messages);
      else setFailure(outcome.error.message);
      return;
    }
    // The shift just made must not warn about itself; any change to the form clears `notice`,
    // and the shift then counts as an ordinary existing one.
    const created = { ...outcome.data, staffName: staff.name, clientName: client.name };
    setShifts((current) => [...current, created]);
    setJustAssignedId(created.id);
    setNotice(
      `Shift assigned: ${staff.name} → ${client.name}, ${date}, ${range.start} - ${range.end}.`,
    );
  }
  /** Cancel a live shift once the admin confirms; the row and its date dot go, the history stays. */
  async function confirmCancel() {
    const shift = cancelling;
    if (!shift || saving) return;
    setCancelling(null);
    setFailure("");
    setNotice("");
    setSaving(true);
    let outcome: Awaited<ReturnType<typeof cancelShift>>;
    try {
      outcome = await cancelShift(shift.id);
    } catch {
      // A rejected action is a failed cancel, not a crash; the shift stays.
      outcome = { ok: false, error: { code: "UNEXPECTED", message: CANCEL_FAILED } };
    }
    setSaving(false);
    if (!outcome.ok) {
      setFailure(outcome.error.message);
      return;
    }
    setShifts((current) => current.filter((row) => row.id !== shift.id));
    setJustAssignedId("");
    setNotice(
      `Shift cancelled: ${carerNameOf(shift)} → ${clientNameOf(shift)}, ${shift.date}, ${shift.start} - ${shift.end}.`,
    );
  }
  return (
    <div className="grid gap-5 p-6 lg:grid-cols-[240px_240px_minmax(0,1fr)] xl:grid-cols-[290px_290px_minmax(0,1fr)] lg:min-h-[calc(100vh-76px)]">
      <PersonList
        title="Staff"
        people={data.staff}
        selected={staffId}
        search={staffSearch}
        key={`staff-${staffSearch}`}
        onSearch={(query) => updateUrl({ staffQ: query })}
        onSelect={(id) => {
          updateUrl({ staff: id });
          setNotice("");
        }}
      />
      <PersonList
        title="Clients"
        people={data.clients}
        selected={clientId}
        search={clientSearch}
        key={`client-${clientSearch}`}
        onSearch={(query) => updateUrl({ clientQ: query })}
        onSelect={(id) => {
          updateUrl({ client: id });
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
        <div
          className={cn(
            "grid min-w-0 gap-6",
            (staff || client) && "2xl:grid-cols-[minmax(0,336px)_minmax(0,1fr)]",
          )}
        >
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
          {(staff || client) && (
            <BookedPanel
              date={date}
              staff={staff}
              client={client}
              shifts={shifts}
              staffList={data.staff}
              clientList={data.clients}
              onCancel={setCancelling}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <TimeRangePicker
            start={start}
            end={end}
            error={errors.end ?? errors.start}
            onChange={(next) => {
              setStart(next.start);
              setEnd(next.end);
              setErrors({});
              setNotice("");
              setFailure("");
            }}
          />
          {staff && !failure && overlaps.length > 0 && (
            <InlineAlert>
              {overlaps
                .map(
                  (shift) =>
                    `${staff.name} already has a shift with ${shift.clientName ?? data.clients.find((person) => person.id === shift.clientId)?.name ?? "another client"} from ${shift.start} - ${shift.end} that overlaps this time.`,
                )
                .join(" ")}{" "}
              You can still assign it.
            </InlineAlert>
          )}
        </div>
        {failure && (
          <p role="alert" className="text-body-default text-text-alert-strong">
            {failure}
          </p>
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
            <Button onClick={assign} disabled={!staff || !client || saving}>
              Assign shift
            </Button>
          </div>
        </div>
      </CardShell>
      <ConfirmationModal
        open={cancelling !== null}
        title="Cancel this shift?"
        body={
          cancelling
            ? `${carerNameOf(cancelling)} with ${clientNameOf(cancelling)}, ${cancelling.date}, ${cancelling.start} - ${cancelling.end}. The shift is removed from the roster and its history is kept.`
            : ""
        }
        confirmLabel="Cancel shift"
        cancelLabel="Keep shift"
        tone="destructive"
        onConfirm={() => void confirmCancel()}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}

function TimePicker({
  label,
  value,
  onChange,
}: {
  label: "Start" | "End";
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour = "00", minute = "00"] = value.split(":");
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field
        label={`${label} hour`}
        type="select"
        value={hour}
        options={hourOptions}
        onChange={(next) => onChange(`${next}:${minute}`)}
      />
      <Field
        label={`${label} minute`}
        type="select"
        value={minute}
        options={minuteOptions}
        onChange={(next) => onChange(`${hour}:${next}`)}
      />
    </div>
  );
}

function TimeRangePicker({
  start,
  end,
  error,
  onChange,
}: {
  start: string;
  end: string;
  error?: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  return (
    <section aria-label="Shift time" className="flex min-w-0 flex-col gap-4">
      <h3 className="text-body-emphasis text-text-primary">Time</h3>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8">
        <TimePicker
          label="Start"
          value={start}
          onChange={(next) => onChange({ start: next, end })}
        />
        <TimePicker label="End" value={end} onChange={(next) => onChange({ start, end: next })} />
      </div>
      {error && <p className="text-body-small text-text-alert-strong">{error}</p>}
      <div className="flex flex-col gap-2">
        <span className="text-body-default text-text-secondary">Common shifts</span>
        <div className="flex flex-wrap gap-2">
          {commonShifts.map((shift) => {
            const pressed = shift.start === start && shift.end === end;
            return (
              <button
                key={`${shift.start}-${shift.end}`}
                type="button"
                aria-pressed={pressed}
                onClick={() => onChange(shift)}
                className={cn(
                  "h-11 rounded-control border px-4 text-body-default transition-colors",
                  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  pressed
                    ? "border-border-brand bg-primary text-primary-foreground"
                    : "border-border-brand bg-bg-surface text-text-primary hover:bg-bg-inset",
                )}
              >
                {shift.start} - {shift.end}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const dayFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** What the selected carer and client already have on the chosen date, so gaps and double-ups show. */
function BookedPanel({
  date,
  staff,
  client,
  shifts,
  staffList,
  clientList,
  onCancel,
}: {
  date: string;
  staff?: ManagePerson;
  client?: ManagePerson;
  shifts: AdminManageData["shifts"];
  staffList: ManagePerson[];
  clientList: ManagePerson[];
  onCancel: (shift: ManageShift) => void;
}) {
  const onDay = shifts
    .filter((shift) => shift.date === date)
    .sort((a, b) => a.start.localeCompare(b.start));
  const nameOf = (list: ManagePerson[], id: string, fallback: string) =>
    list.find((person) => person.id === id)?.name ?? fallback;
  const groups = [
    staff && {
      role: "Carer",
      empty: "No shift",
      person: staff,
      rows: onDay
        .filter((shift) => shift.staffId === staff.id)
        .map((shift) => ({
          ...shift,
          who: shift.clientName ?? nameOf(clientList, shift.clientId, "Another client"),
          carer: staff.name,
          client: shift.clientName ?? nameOf(clientList, shift.clientId, "Another client"),
        })),
    },
    client && {
      role: "Client",
      empty: "No carer assigned",
      person: client,
      rows: onDay
        .filter((shift) => shift.clientId === client.id)
        .map((shift) => ({
          ...shift,
          who: shift.staffName ?? nameOf(staffList, shift.staffId, "Another carer"),
          carer: shift.staffName ?? nameOf(staffList, shift.staffId, "Another carer"),
          client: client.name,
        })),
    },
  ].filter((group) => Boolean(group));
  const heading = "Current shifts on selected day";
  return (
    <section
      aria-label={heading}
      className="flex flex-col gap-3 self-start rounded-inset bg-bg-inset p-4"
    >
      <div>
        <h3 className="text-body-emphasis text-text-primary">{heading}</h3>
        <p className="text-body-default text-text-secondary">
          {dayFormat.format(new Date(`${date}T00:00:00Z`))}
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        {groups.map(
          (group) =>
            group && (
              <div key={group.person.id} className="min-w-0 space-y-2">
                <h4 className="text-body-small uppercase tracking-wide text-text-secondary">
                  {group.role}
                </h4>
                <p className="break-words text-body-emphasis text-text-primary">
                  {group.person.name}
                </p>
                {group.rows.length ? (
                  <ul aria-label={`${group.person.name}'s shifts`} className="space-y-1">
                    {group.rows.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap justify-between gap-x-3 gap-y-2 text-body-default text-text-primary"
                      >
                        <span className="min-w-0 break-words">{row.who}</span>
                        <span>
                          {row.start} - {row.end}
                        </span>
                        {row.editable && (
                          <Button
                            variant="secondary"
                            aria-label={`Cancel shift, ${row.carer}, ${row.client}, ${row.start} - ${row.end}`}
                            onClick={() => onCancel(row)}
                          >
                            Cancel
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-body-default text-text-secondary">{group.empty}</p>
                )}
              </div>
            ),
        )}
      </div>
    </section>
  );
}
