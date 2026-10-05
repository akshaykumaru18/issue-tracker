import { describe, expect, it } from "vitest";
import {
  SESSION_STORAGE_KEY,
  clearSession,
  getBrowserSession,
  readSession,
  saveSession,
  subscribeSession,
  type Session,
  type SessionStorageLike,
} from "./session";

function memoryStorage(initial: Record<string, string> = {}): SessionStorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

const now = new Date("2026-10-05T10:00:00.000Z");

const session: Session = {
  token: "token-1",
  email: "ada@example.com",
  expiresAt: "2026-10-05T10:05:00.000Z",
};

describe("session storage", () => {
  it("saves and reads a session that has not expired", () => {
    const storage = memoryStorage();
    saveSession(session, storage);

    expect(storage.getItem(SESSION_STORAGE_KEY)).toContain("token-1");
    expect(readSession(storage, now)).toEqual(session);
  });

  it("drops missing, expired, and corrupt records", () => {
    const storage = memoryStorage();
    expect(readSession(storage, now)).toBeNull();

    storage.setItem(SESSION_STORAGE_KEY, "{");
    expect(readSession(storage, now)).toBeNull();

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...session, expiresAt: "2026-10-05T10:00:00.000Z" }),
    );
    expect(readSession(storage, now)).toBeNull();

    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: " ", email: "ada@example.com" }));
    expect(readSession(storage, now)).toBeNull();
  });

  it("publishes browser session changes to subscribers", () => {
    const storage = memoryStorage();
    const holder = globalThis as unknown as {
      window?: { sessionStorage: SessionStorageLike };
    };
    const previous = holder.window;
    holder.window = { sessionStorage: storage };
    const seen: Array<Session | null> = [];
    const unsubscribe = subscribeSession(() => {
      seen.push(getBrowserSession());
    });

    try {
      const liveSession = { ...session, expiresAt: "2099-01-01T00:00:00.000Z" };
      saveSession(liveSession);
      expect(getBrowserSession()).toEqual(liveSession);
      clearSession();
      expect(seen).toEqual([liveSession, null]);
    } finally {
      unsubscribe();
      if (previous === undefined) delete holder.window;
      else holder.window = previous;
    }
  });

  it("does nothing when browser storage is unavailable", () => {
    expect(readSession()).toBeNull();
    expect(() => saveSession(session)).not.toThrow();
    expect(() => clearSession()).not.toThrow();
  });

  it("clears the stored session", () => {
    const storage = memoryStorage();
    saveSession(session, storage);
    clearSession(storage);
    expect(readSession(storage, now)).toBeNull();
  });
});
