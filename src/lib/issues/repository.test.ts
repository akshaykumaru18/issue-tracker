import { describe, expect, it, vi } from "vitest";
import { IssueNotFoundError, IssueValidationError } from "./errors";
import {
  createBrowserIssueRepository,
  createLocalStorageIssueRepository,
  createMemoryIssueRepository,
  type KeyValueStorage,
} from "./repository";
import { SEED_ISSUES } from "./seed";
import { ISSUE_STORAGE_KEY } from "./storage";
import type { Issue } from "./types";

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-1",
    title: "Login bug",
    description: "Screen stays blank.",
    status: "open",
    priority: "high",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    ...overrides,
  };
}

function createMemoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const writes: string[] = [];
  const storage: KeyValueStorage = {
    getItem(key) {
      return data.has(key) ? (data.get(key) ?? null) : null;
    },
    setItem(key, value) {
      data.set(key, value);
      writes.push(value);
    },
  };
  return { storage, writes, data };
}

const draft = {
  title: "  Saved issue  ",
  description: "  Details  ",
  status: "open" as const,
  priority: "low" as const,
};

describe("createMemoryIssueRepository", () => {
  it("creates, updates, lists copies, and removes issues", async () => {
    const stamps = ["2026-10-05T00:00:00.000Z", "2026-10-06T00:00:00.000Z"];
    let stampIndex = 0;
    let idIndex = 0;
    const repo = createMemoryIssueRepository([issue(), issue({ id: "issue-1", title: "Dup" })], {
      now: () => stamps[stampIndex++] ?? stamps[stamps.length - 1],
      createId: () => `created-${++idIndex}`,
    });

    expect((await repo.list()).map((item) => item.title)).toEqual(["Login bug"]);

    const created = await repo.create(draft);
    expect(created.title).toBe("Saved issue");
    expect(created.description).toBe("Details");
    expect(created.createdAt).toBe(stamps[0]);

    const listed = await repo.list();
    listed[0].title = "Mutated copy";
    expect((await repo.list())[0].title).toBe("Saved issue");

    const updated = await repo.update(created.id, { status: "done" });
    expect(updated.status).toBe("done");
    expect(updated.createdAt).toBe(stamps[0]);
    expect(updated.updatedAt).toBe(stamps[1]);
    expect(updated.title).toBe("Saved issue");

    await repo.remove(created.id);
    expect(await repo.list()).toEqual([issue()]);
  });

  it("rejects invalid writes and missing issues without dropping stored data", async () => {
    const repo = createMemoryIssueRepository([issue()], {
      now: () => "2026-10-05T00:00:00.000Z",
      createId: () => "created-1",
    });

    await expect(repo.create({ ...draft, title: " " })).rejects.toBeInstanceOf(
      IssueValidationError,
    );
    await expect(repo.update("issue-1", { title: "" })).rejects.toBeInstanceOf(
      IssueValidationError,
    );
    await expect(repo.update("missing", { title: "Still here" })).rejects.toBeInstanceOf(
      IssueNotFoundError,
    );
    await expect(repo.remove("missing")).rejects.toBeInstanceOf(IssueNotFoundError);
    expect(await repo.list()).toEqual([issue()]);
  });

  it("assigns an id and timestamp when no test doubles are provided", async () => {
    const repo = createMemoryIssueRepository();
    const created = await repo.create({
      title: "Default dependencies",
      description: "",
      status: "open",
      priority: "medium",
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    expect(created.createdAt).toBe(created.updatedAt);
  });

  it("drops structurally invalid seed rows", async () => {
    const repo = createMemoryIssueRepository([
      issue(),
      { ...issue({ id: "bad" }), status: "closed" } as unknown as Issue,
    ]);
    expect(await repo.list()).toEqual([issue()]);
  });
});

describe("createLocalStorageIssueRepository", () => {
  it("seeds empty storage once and shares that data across repositories", async () => {
    const { storage, writes } = createMemoryStorage();
    const first = createLocalStorageIssueRepository(storage, {
      now: () => "2026-10-05T00:00:00.000Z",
      createId: () => "created-1",
    });

    const seeded = await first.list();
    expect(seeded.map((item) => item.id)).toEqual(SEED_ISSUES.map((item) => item.id));
    expect(writes).toHaveLength(1);

    const second = createLocalStorageIssueRepository(storage);
    expect(await second.list()).toEqual(seeded);
    expect(writes).toHaveLength(1);

    seeded[0].title = "Mutated";
    expect((await second.list())[0].title).toBe(SEED_ISSUES[0].title);
  });

  it("persists a created issue for the next repository", async () => {
    const { storage } = createMemoryStorage();
    const repo = createLocalStorageIssueRepository(storage, {
      now: () => "2026-10-05T00:00:00.000Z",
      createId: () => "created-1",
    });
    await repo.create(draft);

    const next = createLocalStorageIssueRepository(storage);
    const issues = await next.list();
    expect(issues[0]).toMatchObject({
      id: "created-1",
      title: "Saved issue",
      description: "Details",
    });
    expect(issues).toHaveLength(SEED_ISSUES.length + 1);
  });

  it("does not write when a create is invalid or stored json cannot be parsed", async () => {
    const empty = createMemoryStorage();
    const repo = createLocalStorageIssueRepository(empty.storage, {
      now: () => "2026-10-05T00:00:00.000Z",
      createId: () => "created-1",
    });
    await expect(repo.create({ ...draft, title: "no" })).rejects.toBeInstanceOf(
      IssueValidationError,
    );
    expect(empty.writes).toHaveLength(0);
    expect(empty.data.has(ISSUE_STORAGE_KEY)).toBe(false);

    const corrupt = createMemoryStorage({ [ISSUE_STORAGE_KEY]: "{" });
    const corruptRepo = createLocalStorageIssueRepository(corrupt.storage);
    expect(await corruptRepo.list()).toEqual([]);
    expect(corrupt.writes).toHaveLength(0);
  });

  it("updates and removes persisted issues", async () => {
    const { storage, writes } = createMemoryStorage({
      [ISSUE_STORAGE_KEY]: JSON.stringify([issue()]),
    });
    const repo = createLocalStorageIssueRepository(storage, {
      now: () => "2026-10-07T00:00:00.000Z",
      createId: () => "created-1",
    });

    const updated = await repo.update("issue-1", { priority: "low" });
    expect(updated.priority).toBe("low");
    expect(updated.updatedAt).toBe("2026-10-07T00:00:00.000Z");
    expect(updated.createdAt).toBe(issue().createdAt);

    await expect(repo.update("missing", { title: "Nope" })).rejects.toBeInstanceOf(
      IssueNotFoundError,
    );
    await repo.remove("issue-1");
    expect(await repo.list()).toEqual([]);
    expect(writes.length).toBeGreaterThan(0);

    const reloaded = JSON.parse(storage.getItem(ISSUE_STORAGE_KEY) ?? "null") as unknown[];
    expect(reloaded).toEqual([]);
  });
});

describe("createBrowserIssueRepository", () => {
  it("refuses to open browser storage outside the browser", () => {
    expect(() => createBrowserIssueRepository()).toThrow(/browser/i);
  });

  it("reads and writes window.localStorage in the browser", async () => {
    const { storage } = createMemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });

    try {
      const repository = createBrowserIssueRepository();
      expect(await repository.list()).toHaveLength(SEED_ISSUES.length);
      await repository.create({
        title: "Browser issue",
        description: "",
        status: "open",
        priority: "high",
      });
      expect(await repository.list()).toHaveLength(SEED_ISSUES.length + 1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
