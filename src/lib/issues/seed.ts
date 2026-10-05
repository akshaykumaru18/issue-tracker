import type { Issue } from "./types";

export const SEED_ISSUES: readonly Issue[] = [
  {
    id: "seed-login-blank",
    title: "Login page renders blank",
    description: "The login screen stays white after submit on a slow connection.",
    status: "open",
    priority: "high",
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-03T15:00:00.000Z",
  },
  {
    id: "seed-mobile-filters",
    title: "Stack filters on small screens",
    description: "Status filters should wrap instead of overflowing the viewport.",
    status: "in_progress",
    priority: "medium",
    createdAt: "2026-10-02T11:30:00.000Z",
    updatedAt: "2026-10-04T10:15:00.000Z",
  },
  {
    id: "seed-archive-done",
    title: "Archive completed issues",
    description: "Done issues remain in the list until a backend archive exists.",
    status: "done",
    priority: "low",
    createdAt: "2026-09-28T08:00:00.000Z",
    updatedAt: "2026-09-30T18:45:00.000Z",
  },
];
