import { ISSUE_STATUSES, type IssueListQuery } from "@/lib/issues/types";
import { labelForStatus } from "@/lib/issues/labels";
import type { IssueCounts } from "@/lib/issues/queries";

const FILTERS: Array<{ status: IssueListQuery["status"]; label: string }> = [
  { status: "all", label: "All" },
  ...ISSUE_STATUSES.map((status) => ({
    status,
    label: labelForStatus(status),
  })),
];

type IssueFiltersProps = {
  query: IssueListQuery;
  counts: IssueCounts;
  onChange: (query: IssueListQuery) => void;
};

export function IssueFilters({ query, counts, onChange }: IssueFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="body2" htmlFor="issue-search">
          Search
        </label>
        <input
          id="issue-search"
          className="field body1"
          value={query.search}
          placeholder="Search title or description"
          onChange={(event) => onChange({ ...query, search: event.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((filter) => {
          const active = query.status === filter.status;
          const count = counts[filter.status];
          return (
            <button
              key={filter.status}
              type="button"
              className={active ? "chip chip-active" : "chip"}
              aria-pressed={active}
              onClick={() => onChange({ ...query, status: filter.status })}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
