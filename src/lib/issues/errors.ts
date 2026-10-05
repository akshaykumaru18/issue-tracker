import type { FieldErrors } from "./types";

export class IssueValidationError extends Error {
  readonly errors: FieldErrors;

  constructor(errors: FieldErrors) {
    super("Issue draft is invalid.");
    this.name = "IssueValidationError";
    this.errors = errors;
  }
}

export class IssueNotFoundError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`Issue ${id} was not found.`);
    this.name = "IssueNotFoundError";
    this.id = id;
  }
}

export class DuplicateIssueIdError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`Issue id "${id}" already exists.`);
    this.name = "DuplicateIssueIdError";
    this.id = id;
  }
}

export class EmptyIssueIdError extends Error {
  constructor() {
    super("Issue id generator returned an empty id.");
    this.name = "EmptyIssueIdError";
  }
}

export class InvalidTimestampError extends Error {
  constructor() {
    super("Clock returned an invalid timestamp.");
    this.name = "InvalidTimestampError";
  }
}
