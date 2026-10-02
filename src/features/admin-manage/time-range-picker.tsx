"use client";

import { Field } from "@/components/shared/forms/field";
import { cn } from "@/lib/utils";

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

export function TimeRangePicker({
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
