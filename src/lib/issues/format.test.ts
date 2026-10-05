import { describe, expect, it } from "vitest";
import { formatIssueTimestamp } from "./format";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "./types";
import { labelForPriority, labelForStatus } from "./labels";

describe("labels", () => {
  it("names every status and priority", () => {
    for (const status of ISSUE_STATUSES) {
      expect(labelForStatus(status).length).toBeGreaterThan(0);
    }
    for (const priority of ISSUE_PRIORITIES) {
      expect(labelForPriority(priority).length).toBeGreaterThan(0);
    }
    expect(labelForStatus("in_progress")).toBe("In progress");
    expect(labelForPriority("high")).toBe("High");
  });
});

describe("formatIssueTimestamp", () => {
  it("formats a valid instant in UTC", () => {
    expect(formatIssueTimestamp("2026-10-01T09:00:00.000Z")).toBe("Oct 1, 2026");
  });

  it("returns a fallback for invalid dates", () => {
    expect(formatIssueTimestamp("not-a-date")).toBe("Unknown date");
    expect(formatIssueTimestamp("")).toBe("Unknown date");
  });
});
