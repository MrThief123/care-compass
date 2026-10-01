import { taskDetailHrefFrom } from "@/features/family-task-detail/task-detail-origin";
import { resolveBasePath } from "@/features/family-task-log/base-path";

/**
 * Where the Family · Home screen sends people. Task detail lives at
 * `/family/[clientId]/tasks/[occurrenceKey]` (ARCHITECTURE.md §3.1); an
 * occurrence key is `${eventId}:${originalStartISO}` and holds ':' and '+',
 * so it is encoded into the path segment. The Task log reads
 * `?q=<text>&status=<planned|done|overdue>&page=<n>`, all optional (the
 * contract shared with FAM-UI-07). Each takes an optional base path so a carer's
 * Home stays under `/carer/patients/<id>` (CHG-043).
 */
export const homeRoutes = {
  newEvent: (clientId: string, basePath?: string) =>
    `${resolveBasePath(clientId, basePath)}/events/new`,
  tasks: (clientId: string, basePath?: string) => `${resolveBasePath(clientId, basePath)}/tasks`,
  overdueTasks: (clientId: string, basePath?: string) =>
    `${resolveBasePath(clientId, basePath)}/tasks?status=overdue`,
  /** Carries `from=home`, so Task detail's Back returns to Home (CHG-014). */
  taskDetail: (clientId: string, occurrenceKey: string, basePath?: string) =>
    taskDetailHrefFrom(clientId, occurrenceKey, { from: "home" }, basePath),
  budget: (clientId: string, basePath?: string) => `${resolveBasePath(clientId, basePath)}/budget`,
};
