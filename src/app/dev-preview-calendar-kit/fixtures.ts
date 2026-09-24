/**
 * Synthetic occurrences for the dev-only calendar kit preview (UI-01).
 *
 * Deliberately awkward: overlapping events, 10-minute events, back-to-back
 * runs, long titles and days with more events than a month cell can show, so
 * the preview exercises the cases the reference calendars handle. Specs marked
 * `plain` are plain events (UI-05, CHG-009): no status, drawn with the neutral
 * "Event" look beside the tasks.
 */
import type { AnyOccurrence, OccurrenceStatus } from "@/types/domain";

export const TODAY = "2026-09-18";
export const WEEK_START = "2026-09-14";
export const MONTH = "2026-09-15";

interface Spec {
  date: string;
  time: string;
  minutes: number;
  title: string;
  status?: OccurrenceStatus;
  assignee?: string;
  actor?: string;
  description?: string;
  /** A plain event (UI-05): no status, actor or completion. */
  plain?: boolean;
}

function occurrence(spec: Spec): AnyOccurrence {
  const start = `${spec.date}T${spec.time}:00+10:00`;
  const base = {
    key: `${spec.title.toLowerCase().replace(/\W+/g, "-")}:${start}`,
    eventId: spec.title.toLowerCase().replace(/\W+/g, "-"),
    clientId: "client-margaret",
    title: spec.title,
    description: spec.description ?? "",
    start,
    durationMinutes: spec.minutes,
  };
  if (spec.plain) {
    return { ...base, kind: "event", ...(spec.assignee ? { assignee: spec.assignee } : {}) };
  }
  return {
    ...base,
    status: spec.status ?? "planned",
    ...(spec.assignee ? { assignee: spec.assignee } : {}),
    ...(spec.actor ? { actor: spec.actor } : {}),
  };
}

const DAY_SPECS: Spec[] = [
  {
    date: TODAY,
    time: "07:00",
    minutes: 10,
    title: "Morning medication",
    status: "done",
    actor: "Aisha Rahman",
    assignee: "Aisha Rahman",
    description: "Two tablets with breakfast.",
  },
  {
    date: TODAY,
    time: "07:30",
    minutes: 45,
    title: "Shower and dressing support",
    assignee: "Aisha Rahman",
    status: "done",
    actor: "Aisha Rahman",
  },
  {
    date: TODAY,
    time: "09:00",
    minutes: 120,
    title: "Community access — Northland shopping centre",
    assignee: "Sarah Nguyen",
    description: "Pick-up from the front door. Bus pass is in the blue wallet.",
  },
  {
    date: TODAY,
    time: "09:30",
    minutes: 30,
    title: "Physiotherapy call",
    assignee: "Dr Patel",
    status: "overdue",
  },
  { date: TODAY, time: "12:00", minutes: 30, title: "Lunch", assignee: "Sarah Nguyen" },
  { date: TODAY, time: "12:15", minutes: 15, title: "Midday medication", status: "overdue" },
  {
    date: TODAY,
    time: "14:00",
    minutes: 45,
    title: "Afternoon walk",
    assignee: "Sarah Nguyen",
  },
  {
    date: TODAY,
    time: "14:00",
    minutes: 90,
    title: "Occupational therapy assessment",
    assignee: "Jordan Lee",
  },
  {
    date: TODAY,
    time: "14:20",
    minutes: 20,
    title: "Phone call with plan manager",
  },
  { date: TODAY, time: "11:15", minutes: 30, title: "Short walk", plain: true },
  {
    date: TODAY,
    time: "15:40",
    minutes: 120,
    title: "Afternoon walk",
    assignee: "Aisha Rahman",
    description: "Around the block, or the park if it is fine.",
    plain: true,
  },
  { date: TODAY, time: "16:00", minutes: 60, title: "Music in the lounge", plain: true },
  { date: TODAY, time: "18:00", minutes: 30, title: "Evening medication" },
  {
    date: TODAY,
    time: "20:30",
    minutes: 60,
    title: "Night settle and handover",
    assignee: "Chris Doyle",
  },
];

const WEEK_EXTRA_SPECS: Spec[] = [
  {
    date: "2026-09-14",
    time: "07:00",
    minutes: 10,
    title: "Morning medication",
    status: "done",
    actor: "Aisha Rahman",
  },
  {
    date: "2026-09-14",
    time: "08:30",
    minutes: 480,
    title: "Day program — Bundoora",
    assignee: "Day program",
  },
  {
    date: "2026-09-14",
    time: "11:00",
    minutes: 60,
    title: "Speech therapy",
    assignee: "Jordan Lee",
  },
  {
    date: "2026-09-14",
    time: "19:00",
    minutes: 60,
    title: "Evening routine",
    assignee: "Chris Doyle",
  },
  { date: "2026-09-15", time: "10:00", minutes: 60, title: "GP appointment", assignee: "Dr Patel" },
  { date: "2026-09-15", time: "10:00", minutes: 60, title: "Medication review", status: "overdue" },
  { date: "2026-09-15", time: "13:30", minutes: 45, title: "Haircut at District Cuts" },
  {
    date: "2026-09-16",
    time: "08:30",
    minutes: 480,
    title: "Day program — Bundoora",
    assignee: "Day program",
  },
  {
    date: "2026-09-16",
    time: "10:00",
    minutes: 60,
    title: "Hydrotherapy",
    assignee: "Sarah Nguyen",
  },
  { date: "2026-09-16", time: "13:00", minutes: 60, title: "Support coordination check-in" },
  { date: "2026-09-17", time: "09:00", minutes: 60, title: "Physiotherapy", assignee: "Dr Patel" },
  { date: "2026-09-17", time: "12:00", minutes: 60, title: "Lunch with family" },
  {
    date: "2026-09-17",
    time: "13:00",
    minutes: 120,
    title: "Respite — afternoon",
    assignee: "Chris Doyle",
  },
  { date: "2026-09-17", time: "17:00", minutes: 60, title: "Swimming", assignee: "Sarah Nguyen" },
  { date: "2026-09-15", time: "15:00", minutes: 60, title: "Afternoon walk", plain: true },
  { date: "2026-09-19", time: "14:30", minutes: 45, title: "Picnic in the park", plain: true },
  { date: "2026-09-19", time: "10:00", minutes: 15, title: "Weekly weigh-in" },
  { date: "2026-09-19", time: "11:00", minutes: 180, title: "Family visit" },
  { date: "2026-09-20", time: "09:00", minutes: 10, title: "Morning medication" },
];

const MONTH_EXTRA_SPECS: Spec[] = [
  { date: "2026-09-01", time: "09:00", minutes: 60, title: "Plan review meeting" },
  { date: "2026-09-02", time: "10:00", minutes: 90, title: "Occupational therapy" },
  { date: "2026-09-03", time: "09:00", minutes: 60, title: "Physiotherapy" },
  { date: "2026-09-03", time: "13:00", minutes: 60, title: "Hydrotherapy" },
  { date: "2026-09-04", time: "08:30", minutes: 480, title: "Day program — Bundoora" },
  { date: "2026-09-08", time: "11:00", minutes: 45, title: "Podiatry" },
  { date: "2026-09-09", time: "10:00", minutes: 60, title: "Dentist" },
  { date: "2026-09-10", time: "09:00", minutes: 60, title: "Physiotherapy" },
  { date: "2026-09-10", time: "12:00", minutes: 30, title: "Midday medication" },
  { date: "2026-09-10", time: "15:00", minutes: 60, title: "Community access" },
  { date: "2026-09-10", time: "17:00", minutes: 60, title: "Swimming" },
  { date: "2026-09-11", time: "09:00", minutes: 30, title: "Blood test at Dorevitch" },
  { date: "2026-09-10", time: "16:00", minutes: 45, title: "Afternoon walk", plain: true },
  { date: "2026-09-22", time: "10:00", minutes: 60, title: "GP appointment" },
  { date: "2026-09-22", time: "14:00", minutes: 45, title: "Afternoon walk", plain: true },
  { date: "2026-09-23", time: "09:00", minutes: 60, title: "Speech therapy" },
  { date: "2026-09-24", time: "11:00", minutes: 90, title: "Support coordination review" },
  { date: "2026-09-25", time: "09:00", minutes: 60, title: "Physiotherapy" },
  { date: "2026-09-28", time: "08:30", minutes: 480, title: "Day program — Bundoora" },
  { date: "2026-09-29", time: "14:00", minutes: 60, title: "Equipment fitting" },
  { date: "2026-09-30", time: "10:00", minutes: 45, title: "Dietitian" },
  { date: "2026-10-01", time: "09:00", minutes: 60, title: "Physiotherapy" },
];

export const DAY_OCCURRENCES: AnyOccurrence[] = DAY_SPECS.map(occurrence);
export const WEEK_OCCURRENCES: AnyOccurrence[] = [...DAY_SPECS, ...WEEK_EXTRA_SPECS].map(
  occurrence,
);
export const MONTH_OCCURRENCES: AnyOccurrence[] = [
  ...DAY_SPECS,
  ...WEEK_EXTRA_SPECS,
  ...MONTH_EXTRA_SPECS,
].map(occurrence);
