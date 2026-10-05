import { describe, expect, it } from "vitest";
import { labelForPriority, labelForStatus } from "./labels";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "./types";

describe("issue labels", () => {
  it("has a readable label for every status and priority", () => {
    for (const status of ISSUE_STATUSES) {
      expect(labelForStatus(status).trim().length).toBeGreaterThan(0);
    }
    for (const priority of ISSUE_PRIORITIES) {
      expect(labelForPriority(priority).trim().length).toBeGreaterThan(0);
    }
    expect(labelForStatus("in_progress")).toBe("In progress");
  });
});
