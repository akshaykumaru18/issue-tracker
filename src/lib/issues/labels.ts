import type { IssuePriority, IssueStatus } from "./types";

export const STATUS_LABELS: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function labelForStatus(status: IssueStatus): string {
  return STATUS_LABELS[status];
}

export function labelForPriority(priority: IssuePriority): string {
  return PRIORITY_LABELS[priority];
}
