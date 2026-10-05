import {
  isIssuePriority,
  isIssueStatus,
  type FieldErrors,
  type IssueDraftInput,
  type ValidationResult,
} from "./types";

export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 2000;

export function validateIssueDraft(input: IssueDraftInput): ValidationResult {
  const errors: FieldErrors = {};
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length === 0) {
    errors.title = "Title is required.";
  } else if (title.length < TITLE_MIN_LENGTH) {
    errors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters.`;
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be at most ${TITLE_MAX_LENGTH} characters.`;
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`;
  }

  const status = isIssueStatus(input.status) ? input.status : undefined;
  const priority = isIssuePriority(input.priority) ? input.priority : undefined;

  if (!status) errors.status = "Choose a valid status.";
  if (!priority) errors.priority = "Choose a valid priority.";

  if (!status || !priority || errors.title || errors.description) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { title, description, status, priority },
  };
}
