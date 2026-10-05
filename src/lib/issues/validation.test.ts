import { describe, expect, it } from "vitest";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  isIssue,
  isIssuePriority,
  isIssueStatus,
  type Issue,
} from "./types";
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  validateIssueDraft,
} from "./validation";

const validDraft = {
  title: "Login bug",
  description: "Screen stays blank.",
  status: "open",
  priority: "high",
};

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-1",
    title: "Login bug",
    description: "Screen stays blank.",
    status: "open",
    priority: "high",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("issue guards", () => {
  it("accepts every status and priority", () => {
    for (const status of ISSUE_STATUSES) expect(isIssueStatus(status)).toBe(true);
    for (const priority of ISSUE_PRIORITIES) expect(isIssuePriority(priority)).toBe(true);
  });

  it("rejects unknown status and priority values", () => {
    expect(isIssueStatus("closed")).toBe(false);
    expect(isIssueStatus(1)).toBe(false);
    expect(isIssuePriority("urgent")).toBe(false);
    expect(isIssuePriority(null)).toBe(false);
  });

  it("accepts a complete issue and rejects incomplete values", () => {
    expect(isIssue(issue())).toBe(true);
    expect(isIssue(null)).toBe(false);
    expect(isIssue([])).toBe(false);
    expect(isIssue({ ...issue(), id: "  " })).toBe(false);
    expect(isIssue({ ...issue(), status: "closed" })).toBe(false);
    expect(isIssue({ ...issue(), createdAt: 1 })).toBe(false);
  });
});

describe("validateIssueDraft", () => {
  it("trims a valid draft", () => {
    const result = validateIssueDraft({
      ...validDraft,
      title: "  Login bug  ",
      description: "  Screen stays blank.  ",
    });

    expect(result).toEqual({
      ok: true,
      value: validDraft,
    });
  });

  it("accepts the title and description boundaries", () => {
    const result = validateIssueDraft({
      ...validDraft,
      title: "a".repeat(TITLE_MIN_LENGTH),
      description: "d".repeat(DESCRIPTION_MAX_LENGTH),
    });
    expect(result.ok).toBe(true);

    const maxTitle = validateIssueDraft({
      ...validDraft,
      title: "a".repeat(TITLE_MAX_LENGTH),
    });
    expect(maxTitle.ok).toBe(true);
  });

  it("accepts an empty description", () => {
    const result = validateIssueDraft({ ...validDraft, description: "   " });
    expect(result).toEqual({
      ok: true,
      value: { ...validDraft, description: "" },
    });
  });

  it("accepts every status and priority", () => {
    for (const status of ISSUE_STATUSES) {
      for (const priority of ISSUE_PRIORITIES) {
        expect(validateIssueDraft({ ...validDraft, status, priority }).ok).toBe(true);
      }
    }
  });

  it("reports a required title when the title is blank", () => {
    const result = validateIssueDraft({ ...validDraft, title: " \n " });
    expect(result).toEqual({
      ok: false,
      errors: { title: "Title is required." },
    });
  });

  it("reports title length errors", () => {
    const short = validateIssueDraft({
      ...validDraft,
      title: "a".repeat(TITLE_MIN_LENGTH - 1),
    });
    const long = validateIssueDraft({
      ...validDraft,
      title: "a".repeat(TITLE_MAX_LENGTH + 1),
    });

    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.errors.title).toMatch(/at least 3/);
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.errors.title).toMatch(/at most 120/);
  });

  it("reports an oversized description", () => {
    const result = validateIssueDraft({
      ...validDraft,
      description: "d".repeat(DESCRIPTION_MAX_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.description).toMatch(/at most 2000/);
  });

  it("reports every invalid field together", () => {
    const result = validateIssueDraft({
      title: "",
      description: "d".repeat(DESCRIPTION_MAX_LENGTH + 1),
      status: "closed",
      priority: "urgent",
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        title: "Title is required.",
        description: "Description must be at most 2000 characters.",
        status: "Choose a valid status.",
        priority: "Choose a valid priority.",
      },
    });
  });
});
