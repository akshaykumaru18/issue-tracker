import { IssueNotFoundError, IssueValidationError } from "./errors";
import { SEED_ISSUES } from "./seed";
import {
  createIssueRecord,
  mergeIssueDraft,
  removeIssue,
  replaceIssue,
  type IssueStoreDeps,
} from "./store";
import { dedupeIssues, ISSUE_STORAGE_KEY, parseStoredIssues } from "./storage";
import type { Issue, IssueDraft, IssuePatch } from "./types";
import { isIssue } from "./types";
import { validateIssueDraft } from "./validation";

/**
 * Screen code depends on this port.
 * A later HTTP implementation can replace browser storage without changing the UI.
 */
export type IssueRepository = {
  list(): Promise<Issue[]>;
  create(draft: IssueDraft): Promise<Issue>;
  update(id: string, patch: IssuePatch): Promise<Issue>;
  remove(id: string): Promise<void>;
};

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function resolveDeps(deps?: Partial<IssueStoreDeps>): IssueStoreDeps {
  return {
    now: deps?.now ?? (() => new Date().toISOString()),
    createId: deps?.createId ?? (() => crypto.randomUUID()),
  };
}

function assertValidDraft(draft: IssueDraft): IssueDraft {
  const result = validateIssueDraft(draft);
  if (!result.ok) throw new IssueValidationError(result.errors);
  return result.value;
}

export function createMemoryIssueRepository(
  initial: readonly Issue[] = [],
  deps?: Partial<IssueStoreDeps>,
): IssueRepository {
  let issues = dedupeIssues(initial.filter(isIssue));
  const resolved = resolveDeps(deps);

  return {
    async list() {
      return issues.map((issue) => ({ ...issue }));
    },
    async create(draft) {
      const value = assertValidDraft(draft);
      const next = createIssueRecord(issues, value, resolved);
      issues = next.issues;
      return { ...next.created };
    },
    async update(id, patch) {
      const current = issues.find((issue) => issue.id === id);
      if (!current) throw new IssueNotFoundError(id);
      const value = assertValidDraft(mergeIssueDraft(current, patch));
      const next = replaceIssue(issues, id, value, resolved.now());
      issues = next.issues;
      return { ...next.updated };
    },
    async remove(id) {
      issues = removeIssue(issues, id);
    },
  };
}

export function createLocalStorageIssueRepository(
  storage: KeyValueStorage,
  deps?: Partial<IssueStoreDeps>,
): IssueRepository {
  const resolved = resolveDeps(deps);

  function load(): Issue[] {
    const raw = storage.getItem(ISSUE_STORAGE_KEY);
    if (raw === null) {
      const seeded = dedupeIssues(SEED_ISSUES);
      storage.setItem(ISSUE_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parseStoredIssues(raw);
  }

  function save(next: readonly Issue[]) {
    storage.setItem(ISSUE_STORAGE_KEY, JSON.stringify(next));
  }

  return {
    async list() {
      return load().map((issue) => ({ ...issue }));
    },
    async create(draft) {
      const value = assertValidDraft(draft);
      const current = load();
      const next = createIssueRecord(current, value, resolved);
      save(next.issues);
      return { ...next.created };
    },
    async update(id, patch) {
      const current = load();
      const existing = current.find((issue) => issue.id === id);
      if (!existing) throw new IssueNotFoundError(id);
      const value = assertValidDraft(mergeIssueDraft(existing, patch));
      const next = replaceIssue(current, id, value, resolved.now());
      save(next.issues);
      return { ...next.updated };
    },
    async remove(id) {
      const current = load();
      save(removeIssue(current, id));
    },
  };
}

export function createBrowserIssueRepository(): IssueRepository {
  if (typeof window === "undefined") {
    throw new Error("Browser issue storage is only available in the browser.");
  }
  return createLocalStorageIssueRepository(window.localStorage);
}
