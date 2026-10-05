import { formatIssueTimestamp } from "@/lib/issues/format";
import { labelForPriority, labelForStatus } from "@/lib/issues/labels";
import type { Issue } from "@/lib/issues/types";

type IssueListProps = {
  issues: readonly Issue[];
  selectedId: string | null;
  ready: boolean;
  totalCount: number;
  onSelect: (issue: Issue) => void;
};

export function IssueList({
  issues,
  selectedId,
  ready,
  totalCount,
  onSelect,
}: IssueListProps) {
  if (!ready) {
    return (
      <p className="body1" role="status">
        Loading issues…
      </p>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="card">
        <h2 className="heading2">
          {totalCount === 0 ? "No issues yet" : "No matching issues"}
        </h2>
        <p className="body1 mt-2">
          {totalCount === 0
            ? "Create the first issue with the button above."
            : "Try another status or clear the search."}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {issues.map((issue) => {
        const selected = issue.id === selectedId;
        return (
          <li key={issue.id}>
            <button
              type="button"
              className={
                selected
                  ? "card card-active block w-full text-left"
                  : "card block w-full text-left"
              }
              aria-pressed={selected}
              onClick={() => onSelect(issue)}
            >
              <span className="flex flex-wrap gap-2">
                <span className={issue.status === "open" ? "badge badge-solid" : "badge"}>
                  {labelForStatus(issue.status)}
                </span>
                <span className={issue.priority === "high" ? "badge badge-solid" : "badge"}>
                  {labelForPriority(issue.priority)}
                </span>
              </span>
              <span className="heading2 mt-3 block">{issue.title}</span>
              <span className="body2 clamp-2 mt-2 block">
                {issue.description || "No description"}
              </span>
              <span className="body2 mt-3 block">
                Updated {formatIssueTimestamp(issue.updatedAt)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
