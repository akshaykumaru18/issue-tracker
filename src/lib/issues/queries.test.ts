import { describe, expect, it } from "vitest";
import { countByStatus, queryIssues } from "./queries";
import type { Issue } from "./types";

function issue(overrides: Partial<Issue>): Issue {
  return {
    id: "issue-1",
    title: "Login bug",
    description: "Screen stays blank.",
    status: "open",
    priority: "medium",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

const issues: Issue[] = [
  issue({
    id: "open-old",
    title: "Open question",
    description: "Needs a product decision.",
    status: "open",
    updatedAt: "2026-10-02T00:00:00.000Z",
  }),
  issue({
    id: "progress-new",
    title: "Mobile layout",
    description: "Filters overflow on a phone.",
    status: "in_progress",
    updatedAt: "2026-10-04T00:00:00.000Z",
  }),
  issue({
    id: "done-mid",
    title: "Archive done work",
    description: "Keep completed issues visible.",
    status: "done",
    updatedAt: "2026-10-03T00:00:00.000Z",
  }),
  issue({
    id: "same-time-b",
    title: "Beta follow up",
    description: "Check the beta notes.",
    status: "open",
    updatedAt: "2026-10-04T00:00:00.000Z",
  }),
];

describe("queryIssues", () => {
  it("returns every issue newest first, then by id", () => {
    const result = queryIssues(issues, { status: "all", search: "   " });
    expect(result.map((item) => item.id)).toEqual([
      "same-time-b",
      "progress-new",
      "done-mid",
      "open-old",
    ]);
  });

  it("filters by status and search together", () => {
    const result = queryIssues(issues, { status: "open", search: "beta" });
    expect(result.map((item) => item.id)).toEqual(["same-time-b"]);
  });

  it("matches the description without treating the search as a regular expression", () => {
    const result = queryIssues(issues, { status: "all", search: "(bug" });
    expect(result).toEqual([]);

    const literal = queryIssues(
      [issue({ id: "literal", title: "Parse (bug.*)", description: "" })],
      { status: "done", search: "bug.*" },
    );
    expect(literal).toEqual([]);

    const found = queryIssues(
      [issue({ id: "literal", title: "Parse (bug.*)", description: "notes" })],
      { status: "all", search: "Bug.*" },
    );
    expect(found.map((item) => item.id)).toEqual(["literal"]);
  });

  it("does not change the input list", () => {
    const snapshot = issues.map((item) => ({ ...item }));
    queryIssues(issues, { status: "done", search: "archive" });
    expect(issues).toEqual(snapshot);
  });
});

describe("countByStatus", () => {
  it("counts each status from the full list", () => {
    expect(countByStatus(issues)).toEqual({
      all: 4,
      open: 2,
      in_progress: 1,
      done: 1,
    });
  });

  it("returns zeroes for an empty list", () => {
    expect(countByStatus([])).toEqual({
      all: 0,
      open: 0,
      in_progress: 0,
      done: 0,
    });
  });
});
