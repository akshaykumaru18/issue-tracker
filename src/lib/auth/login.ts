import type { Session } from "@/lib/auth/session";

export const LOGIN_SERVICE_UNREACHABLE = "The login service could not be reached.";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; message: string };

export type LoginFetch = (input: string, init?: RequestInit) => Promise<Response>;

type LoginSuccessBody = {
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
  email: string;
};

function defaultApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:4000";
}

function loginUrl(apiBase: string): string {
  const base = apiBase.trim().replace(/\/+$/, "") || "http://localhost:4000";
  return `${base}/api/auth/login`;
}

function isLoginSuccessBody(value: unknown): value is LoginSuccessBody {
  if (!value || typeof value !== "object") return false;

  const body = value as Record<string, unknown>;
  return (
    typeof body.token === "string" &&
    body.token.length > 0 &&
    body.tokenType === "Bearer" &&
    typeof body.expiresIn === "number" &&
    Number.isFinite(body.expiresIn) &&
    body.expiresIn >= 0 &&
    typeof body.email === "string" &&
    body.email.length > 0
  );
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("message" in body)) return null;

    const message = (body as { message: unknown }).message;
    if (typeof message !== "string") return null;

    const trimmed = message.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export async function loginRequest(
  credentials: LoginCredentials,
  fetchImpl: LoginFetch = fetch,
  apiBase: string = defaultApiBase(),
  now: () => Date = () => new Date(),
): Promise<LoginResult> {
  const email = credentials.email.trim();

  let response: Response;
  try {
    response = await fetchImpl(loginUrl(apiBase), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password: credentials.password }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: LOGIN_SERVICE_UNREACHABLE };
  }

  if (response.status === 400 || response.status === 401) {
    const message = await readErrorMessage(response);
    return { ok: false, message: message ?? LOGIN_SERVICE_UNREACHABLE };
  }

  if (response.status !== 200) {
    return { ok: false, message: LOGIN_SERVICE_UNREACHABLE };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, message: LOGIN_SERVICE_UNREACHABLE };
  }

  if (!isLoginSuccessBody(body)) {
    return { ok: false, message: LOGIN_SERVICE_UNREACHABLE };
  }

  const expiresAtDate = new Date(now().getTime() + body.expiresIn * 1000);
  if (Number.isNaN(expiresAtDate.getTime())) {
    return { ok: false, message: LOGIN_SERVICE_UNREACHABLE };
  }

  return {
    ok: true,
    session: {
      token: body.token,
      email: body.email,
      expiresAt: expiresAtDate.toISOString(),
    },
  };
}
