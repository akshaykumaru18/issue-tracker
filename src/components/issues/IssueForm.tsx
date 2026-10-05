import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  isIssuePriority,
  isIssueStatus,
  type FieldErrors,
  type IssueDraft,
} from "@/lib/issues/types";
import { labelForPriority, labelForStatus } from "@/lib/issues/labels";
import { formatIssueTimestamp } from "@/lib/issues/format";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";

type IssueFormProps = {
  mode: "create" | "edit";
  draft: IssueDraft;
  errors: FieldErrors;
  saving: boolean;
  confirmDelete: boolean;
  updatedAt?: string;
  onChange: (patch: Partial<IssueDraft>) => void;
  onSubmit: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export function IssueForm({
  mode,
  draft,
  errors,
  saving,
  confirmDelete,
  updatedAt,
  onChange,
  onSubmit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: IssueFormProps) {
  return (
    <form
      className="card flex flex-col gap-4"
      aria-busy={saving}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <h2 className="heading2">{mode === "create" ? "New issue" : "Edit issue"}</h2>
        {updatedAt ? (
          <p className="body2 mt-1">Updated {formatIssueTimestamp(updatedAt)}</p>
        ) : (
          <p className="body2 mt-1">Add a title, status, and priority.</p>
        )}
      </div>

      <TextField
        id="issue-title"
        label="Title"
        value={draft.title}
        error={errors.title}
        disabled={saving}
        onChange={(title) => onChange({ title })}
      />
      <TextField
        id="issue-description"
        label="Description"
        value={draft.description}
        error={errors.description}
        multiline
        disabled={saving}
        onChange={(description) => onChange({ description })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="issue-status"
          label="Status"
          value={draft.status}
          error={errors.status}
          disabled={saving}
          options={ISSUE_STATUSES.map((status) => ({
            value: status,
            label: labelForStatus(status),
          }))}
          onChange={(status) => {
            if (isIssueStatus(status)) onChange({ status });
          }}
        />
        <SelectField
          id="issue-priority"
          label="Priority"
          value={draft.priority}
          error={errors.priority}
          disabled={saving}
          options={ISSUE_PRIORITIES.map((priority) => ({
            value: priority,
            label: labelForPriority(priority),
          }))}
          onChange={(priority) => {
            if (isIssuePriority(priority)) onChange({ priority });
          }}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
          {mode === "create" ? "Create issue" : "Save changes"}
        </Button>
        {mode === "edit" && !confirmDelete ? (
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={onRequestDelete}
          >
            Delete
          </Button>
        ) : null}
      </div>

      {mode === "edit" && confirmDelete ? (
        <div className="alert" role="alert">
          <p className="body1">Delete this issue?</p>
          <p className="body2 mt-1">This removes it from browser storage.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              disabled={saving}
              onClick={onConfirmDelete}
            >
              Delete issue
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              disabled={saving}
              onClick={onCancelDelete}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
