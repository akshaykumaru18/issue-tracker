import { describe, expect, it } from "vitest";
import {
  DuplicateIssueIdError,
  EmptyIssueIdError,
  InvalidTimestampError,
  IssueNotFoundError,
} from "./errors";
import {
  createIssueRecord,
  mergeIssueDraft,
  removeIssue,
  replaceIssue,
} from "./store";
import type { Issue, IssueDraft } from "./types";

function issue(overrides: Partial<Issue> = {}): Issue {
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

const draft: IssueDraft = {
  title: "New login bug",
  description: "Form does not submit.",
  status: "in_progress",
  priority: "high",
};

describe("issue store", () => {
  it("creates an issue without changing the previous list", () => {
    const current = [issue()];
    const result = createIssueRecord(current, draft, {
      now: () => "2026-10-05T00:00:00.000Z",
      createId: () => "issue-2",
    });

    expect(result.created).toEqual({
      ...draft,
      id: "issue-2",
      createdAt: "2026-10-05T00:00:00.000Z",
      updatedAt: "2026-10-05T00:00:00.000Z",
    });
    expect(result.issues.map((item) => item.id)).toEqual(["issue-2", "issue-1"]);
    expect(current).toEqual([issue()]);
    expect(result.issues[1]).not.toBe(current[0]);
  });

  it("rejects an empty or duplicate id and an invalid clock", () => {
    const current = [issue()];
    expect(() =>
      createIssueRecord(current, draft, {
        now: () => "2026-10-05T00:00:00.000Z",
        createId: () => "   ",
      }),
    ).toThrow(EmptyIssueIdError);
    expect(() =>
      createIssueRecord(current, draft, {
        now: () => "2026-10-05T00:00:00.000Z",
        createId: () => "issue-1",
      }),
    ).toThrow(DuplicateIssueIdError);
    expect(() =>
      createIssueRecord(current, draft, {
        now: () => "yesterday",
        createId: () => "issue-2",
      }),
    ).toThrow(InvalidTimestampError);
    expect(current).toEqual([issue()]);
  });

  it("replaces editable fields and keeps identity timestamps stable", () => {
    const current = [issue(), issue({ id: "issue-2", title: "Other" })];
    const result = replaceIssue(current, "issue-1", draft, "2026-10-06T00:00:00.000Z");

    expect(result.updated).toEqual({
      ...draft,
      id: "issue-1",
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-06T00:00:00.000Z",
    });
    expect(current[0]).toEqual(issue());
    expect(result.issues[1]).toEqual(issue({ id: "issue-2", title: "Other" }));
  });

  it("throws when replacing or removing a missing issue", () => {
    const current = [issue()];
    expect(() => replaceIssue(current, "missing", draft, "2026-10-06T00:00:00.000Z")).toThrow(
      IssueNotFoundError,
    );
    expect(() => replaceIssue(current, "issue-1", draft, "nope")).toThrow(InvalidTimestampError);
    expect(() => removeIssue(current, "missing")).toThrow(IssueNotFoundError);
    expect(current).toEqual([issue()]);
  });

  it("removes one issue and leaves the others untouched", () => {
    const current = [issue(), issue({ id: "issue-2" })];
    const next = removeIssue(current, "issue-1");
    expect(next.map((item) => item.id)).toEqual(["issue-2"]);
    expect(next[0]).not.toBe(current[1]);
    expect(current).toHaveLength(2);
  });

  it("merges a partial patch over the current draft", () => {
    expect(mergeIssueDraft(issue(), { priority: "low" })).toEqual({
      title: "Login bug",
      description: "Screen stays blank.",
      status: "open",
      priority: "low",
    });
    expect(mergeIssueDraft(issue(), { title: "" }).title).toBe("");
  });
});
