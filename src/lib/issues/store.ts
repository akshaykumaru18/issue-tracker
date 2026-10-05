import {
  DuplicateIssueIdError,
  EmptyIssueIdError,
  InvalidTimestampError,
  IssueNotFoundError,
} from "./errors";
import type { Issue, IssueDraft, IssuePatch } from "./types";

export type IssueStoreDeps = {
  now: () => string;
  createId: () => string;
};

function cloneIssue(issue: Issue): Issue {
  return { ...issue };
}

function assertTimestamp(value: string): string {
  if (Number.isNaN(Date.parse(value))) {
    throw new InvalidTimestampError();
  }
  return value;
}

function assertId(id: string, issues: readonly Issue[]): string {
  const trimmed = id.trim();
  if (!trimmed) throw new EmptyIssueIdError();
  if (issues.some((issue) => issue.id === trimmed)) {
    throw new DuplicateIssueIdError(trimmed);
  }
  return trimmed;
}

export function mergeIssueDraft(issue: Issue, patch: IssuePatch): IssueDraft {
  return {
    title: patch.title ?? issue.title,
    description: patch.description ?? issue.description,
    status: patch.status ?? issue.status,
    priority: patch.priority ?? issue.priority,
  };
}

export function createIssueRecord(
  issues: readonly Issue[],
  draft: IssueDraft,
  deps: IssueStoreDeps,
): { issues: Issue[]; created: Issue } {
  const timestamp = assertTimestamp(deps.now());
  const created: Issue = {
    id: assertId(deps.createId(), issues),
    title: draft.title,
    description: draft.description,
    status: draft.status,
    priority: draft.priority,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    created,
    issues: [created, ...issues.map(cloneIssue)],
  };
}

export function replaceIssue(
  issues: readonly Issue[],
  id: string,
  draft: IssueDraft,
  now: string,
): { issues: Issue[]; updated: Issue } {
  const index = issues.findIndex((issue) => issue.id === id);
  if (index === -1) throw new IssueNotFoundError(id);

  const current = issues[index];
  const updated: Issue = {
    id: current.id,
    title: draft.title,
    description: draft.description,
    status: draft.status,
    priority: draft.priority,
    createdAt: current.createdAt,
    updatedAt: assertTimestamp(now),
  };

  const next = issues.map(cloneIssue);
  next[index] = updated;
  return { issues: next, updated };
}

export function removeIssue(issues: readonly Issue[], id: string): Issue[] {
  if (!issues.some((issue) => issue.id === id)) {
    throw new IssueNotFoundError(id);
  }
  return issues.filter((issue) => issue.id !== id).map(cloneIssue);
}
