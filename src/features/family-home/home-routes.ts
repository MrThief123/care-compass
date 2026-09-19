/**
 * Where the Family · Home screen sends people. Task detail lives at
 * `/family/[clientId]/tasks/[occurrenceKey]` (ARCHITECTURE.md §3.1); an
 * occurrence key is `${eventId}:${originalStartISO}` and holds ':' and '+',
 * so it is encoded into the path segment.
 */
export const homeRoutes = {
  newEvent: (clientId: string) => `/family/${clientId}/events/new`,
  tasks: (clientId: string) => `/family/${clientId}/tasks`,
  taskDetail: (clientId: string, occurrenceKey: string) =>
    `/family/${clientId}/tasks/${encodeURIComponent(occurrenceKey)}`,
  budget: (clientId: string) => `/family/${clientId}/budget`,
};
