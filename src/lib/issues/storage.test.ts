import { describe, expect, it } from "vitest";
import { dedupeIssues, ISSUE_STORAGE_KEY, parseStoredIssues } from "./storage";
import type { Issue } from "./types";

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-1",
    title: "Login bug",
    description: "Screen stays blank.",
    status: "open",
    priority: "low",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseStoredIssues", () => {
  it("returns an empty list for corrupt or non-array payloads", () => {
    expect(parseStoredIssues("{")).toEqual([]);
    expect(parseStoredIssues("{}")).toEqual([]);
    expect(parseStoredIssues("null")).toEqual([]);
  });

  it("keeps the first copy of a duplicate id and drops invalid rows", () => {
    const first = issue({ title: "First" });
    const duplicate = issue({ title: "Second" });
    const raw = JSON.stringify([first, { ...duplicate, status: "closed" }, duplicate]);
    const parsed = parseStoredIssues(raw);

    expect(parsed).toEqual([first]);
    parsed[0].title = "Changed";
    expect(first.title).toBe("First");
  });

  it("uses the storage key expected by a future backend migration", () => {
    expect(ISSUE_STORAGE_KEY).toBe("issue-tracker.issues.v1");
  });
});

describe("dedupeIssues", () => {
  it("copies issues so later edits do not leak into the source", () => {
    const source = [issue(), issue({ id: "issue-1", title: "Duplicate" })];
    const unique = dedupeIssues(source);
    unique[0].title = "Changed";
    expect(source[0].title).toBe("Login bug");
    expect(unique).toHaveLength(1);
  });
});
