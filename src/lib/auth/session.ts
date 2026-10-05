export const SESSION_STORAGE_KEY = "issue-tracker.session.v1";

export type Session = {
  token: string;
  email: string;
  expiresAt: string;
};

export type SessionStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const sessionListeners = new Set<() => void>();
let snapshotRaw: string | null | undefined;
let snapshotSession: Session | null = null;

function browserSessionStorage(): SessionStorageLike | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function notifySessionListeners(): void {
  snapshotRaw = undefined;
  for (const listener of sessionListeners) listener();
}

export function subscribeSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export function getBrowserSession(): Session | null {
  const store = browserSessionStorage();
  if (!store) return null;

  const raw = store.getItem(SESSION_STORAGE_KEY);
  if (raw === snapshotRaw) return snapshotSession;

  snapshotRaw = raw;
  snapshotSession = readSession(store);
  return snapshotSession;
}

function resolveStorage(storage?: SessionStorageLike): SessionStorageLike | null {
  return storage ?? browserSessionStorage();
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseSession(value: unknown, now: Date): Session | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (!nonEmptyString(record.token) || !nonEmptyString(record.email)) return null;
  if (typeof record.expiresAt !== "string") return null;

  const expiresAtMs = Date.parse(record.expiresAt);
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= now.getTime()) return null;

  return {
    token: record.token,
    email: record.email,
    expiresAt: record.expiresAt,
  };
}

export function saveSession(session: Session, storage?: SessionStorageLike): void {
  const store = resolveStorage(storage);
  if (!store) return;

  const payload: Session = {
    token: session.token,
    email: session.email,
    expiresAt: session.expiresAt,
  };
  store.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  if (!storage) notifySessionListeners();
}

export function readSession(storage?: SessionStorageLike, now: Date = new Date()): Session | null {
  const store = resolveStorage(storage);
  if (!store) return null;

  const raw = store.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return parseSession(JSON.parse(raw) as unknown, now);
  } catch {
    return null;
  }
}

export function clearSession(storage?: SessionStorageLike): void {
  const store = resolveStorage(storage);
  if (!store) return;
  store.removeItem(SESSION_STORAGE_KEY);
  if (!storage) notifySessionListeners();
}
