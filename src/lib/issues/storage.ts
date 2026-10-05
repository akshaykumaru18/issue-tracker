import { isIssue, type Issue } from "./types";

export const ISSUE_STORAGE_KEY = "issue-tracker.issues.v1";

export function dedupeIssues(issues: readonly Issue[]): Issue[] {
  const seen = new Set<string>();
  const unique: Issue[] = [];

  for (const issue of issues) {
    if (seen.has(issue.id)) continue;
    seen.add(issue.id);
    unique.push({ ...issue });
  }

  return unique;
}

export function parseStoredIssues(raw: string): Issue[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];
  return dedupeIssues(parsed.filter(isIssue));
}
