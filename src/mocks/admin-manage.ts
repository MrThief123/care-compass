/** Synthetic Admin Manage design data; no real staff or client records. */
export const ADMIN_MANAGE = {
  referenceDate: "2026-11-30",
  staff: [
    { id: "aisha", name: "Aisha Rahman" },
    { id: "daniel", name: "Daniel Kelly" },
    { id: "sarah", name: "Sarah Nguyen" },
    { id: "marcus", name: "Marcus Chen" },
    { id: "fatima", name: "Fatima Ali" },
  ],
  clients: [
    { id: "margaret", name: "Margaret Doyle" },
    { id: "robert", name: "Robert Hale" },
    { id: "elsie", name: "Elsie Marsh" },
    { id: "frank", name: "Frank Novak" },
    { id: "doris", name: "Doris Petrov" },
  ],
  shifts: [
    {
      id: "shift-30",
      staffId: "aisha",
      clientId: "margaret",
      date: "2026-11-30",
      start: "11:30",
      end: "13:00",
    },
    ...["2026-11-24", "2026-11-26", "2026-11-27", "2026-12-02", "2026-12-04"].map((date) => ({
      id: `shift-${date}`,
      staffId: "aisha",
      clientId: "margaret",
      date,
      start: "11:30",
      end: "13:00",
    })),
  ],
};
