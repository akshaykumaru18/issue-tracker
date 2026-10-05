export const ISSUE_STATUSES = ["open", "in_progress", "done"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_PRIORITIES = ["low", "medium", "high"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: string;
  updatedAt: string;
};

export type IssueDraft = {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
};

export type IssueDraftInput = {
  title: string;
  description: string;
  status: string;
  priority: string;
};

export type IssuePatch = Partial<IssueDraft>;

export type IssueListQuery = {
  status: IssueStatus | "all";
  search: string;
};

export type FieldErrors = Partial<Record<keyof IssueDraft, string>>;

export type ValidationResult =
  | { ok: true; value: IssueDraft }
  | { ok: false; errors: FieldErrors };

export function isIssueStatus(value: unknown): value is IssueStatus {
  return (
    typeof value === "string" &&
    (ISSUE_STATUSES as readonly string[]).includes(value)
  );
}

export function isIssuePriority(value: unknown): value is IssuePriority {
  return (
    typeof value === "string" &&
    (ISSUE_PRIORITIES as readonly string[]).includes(value)
  );
}

export function isIssue(value: unknown): value is Issue {
  if (!value || typeof value !== "object") return false;
  const issue = value as Record<string, unknown>;
  return (
    typeof issue.id === "string" &&
    issue.id.trim().length > 0 &&
    typeof issue.title === "string" &&
    typeof issue.description === "string" &&
    isIssueStatus(issue.status) &&
    isIssuePriority(issue.priority) &&
    typeof issue.createdAt === "string" &&
    typeof issue.updatedAt === "string"
  );
}
