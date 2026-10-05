import type { Issue, IssueListQuery, IssueStatus } from "./types";

export type IssueCounts = Record<"all" | IssueStatus, number>;

export function queryIssues(
  issues: readonly Issue[],
  query: IssueListQuery,
): Issue[] {
  const search = query.search.trim().toLowerCase();

  return issues
    .filter((issue) => {
      if (query.status !== "all" && issue.status !== query.status) return false;
      if (!search) return true;
      const haystack = `${issue.title}\n${issue.description}`.toLowerCase();
      return haystack.includes(search);
    })
    .map((issue) => ({ ...issue }))
    .sort((left, right) => {
      const byUpdated = right.updatedAt.localeCompare(left.updatedAt);
      if (byUpdated !== 0) return byUpdated;
      return right.id.localeCompare(left.id);
    });
}

export function countByStatus(issues: readonly Issue[]): IssueCounts {
  const counts: IssueCounts = {
    all: issues.length,
    open: 0,
    in_progress: 0,
    done: 0,
  };

  for (const issue of issues) {
    counts[issue.status] += 1;
  }

  return counts;
}
