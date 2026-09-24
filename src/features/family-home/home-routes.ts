import { taskDetailHrefFrom } from "@/features/family-task-detail/task-detail-origin";

/**
 * Where the Family · Home screen sends people. Task detail lives at
 * `/family/[clientId]/tasks/[occurrenceKey]` (ARCHITECTURE.md §3.1); an
 * occurrence key is `${eventId}:${originalStartISO}` and holds ':' and '+',
 * so it is encoded into the path segment. The Task log reads
 * `?q=<text>&status=<planned|done|overdue>&page=<n>`, all optional (the
 * contract shared with FAM-UI-07).
 */
export const homeRoutes = {
  newEvent: (clientId: string) => `/family/${clientId}/events/new`,
  tasks: (clientId: string) => `/family/${clientId}/tasks`,
  overdueTasks: (clientId: string) => `/family/${clientId}/tasks?status=overdue`,
  /** Carries `from=home`, so Task detail's Back returns to Home (CHG-014). */
  taskDetail: (clientId: string, occurrenceKey: string) =>
    taskDetailHrefFrom(clientId, occurrenceKey, { from: "home" }),
  budget: (clientId: string) => `/family/${clientId}/budget`,
};
