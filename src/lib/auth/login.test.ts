import { describe, expect, it } from "vitest";
import { LOGIN_SERVICE_UNREACHABLE, loginRequest, type LoginFetch } from "./login";

const now = () => new Date("2026-10-05T10:00:00.000Z");

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("loginRequest", () => {
  it("calls the local API when no base is provided", async () => {
    const fetchImpl: LoginFetch = async (url) => {
      expect(url).toBe("http://localhost:4000/api/auth/login");
      return jsonResponse(200, {
        token: "signed-token",
        tokenType: "Bearer",
        expiresIn: 300,
        email: "ada@example.com",
      });
    };

    const result = await loginRequest(
      { email: "ada@example.com", password: "tracker-pass" },
      fetchImpl,
    );
    expect(result.ok).toBe(true);
  });

  it("returns a session that expires in the number of seconds from the API", async () => {
    const fetchImpl: LoginFetch = async (url, init) => {
      expect(url).toBe("http://localhost:4000/api/auth/login");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(
        JSON.stringify({ email: "ada@example.com", password: "tracker-pass" }),
      );
      return jsonResponse(200, {
        token: "signed-token",
        tokenType: "Bearer",
        expiresIn: 300,
        email: "ada@example.com",
      });
    };

    const result = await loginRequest(
      { email: "  ada@example.com  ", password: "tracker-pass" },
      fetchImpl,
      "http://localhost:4000/",
      now,
    );

    expect(result).toEqual({
      ok: true,
      session: {
        token: "signed-token",
        email: "ada@example.com",
        expiresAt: "2026-10-05T10:05:00.000Z",
      },
    });
  });

  it("uses the API message for 400 and 401", async () => {
    const denied: LoginFetch = async () =>
      jsonResponse(401, { message: "Email or password is incorrect." });
    const missing: LoginFetch = async () =>
      jsonResponse(400, { message: "Enter an email and password." });

    await expect(
      loginRequest({ email: "ada@example.com", password: "nope" }, denied, "http://localhost:4000", now),
    ).resolves.toEqual({ ok: false, message: "Email or password is incorrect." });

    await expect(
      loginRequest({ email: "", password: "" }, missing, "http://localhost:4000", now),
    ).resolves.toEqual({ ok: false, message: "Enter an email and password." });
  });

  it("reports an unreachable service when the response is unusable", async () => {
    const cases: LoginFetch[] = [
      async () => {
        throw new Error("offline");
      },
      async () => jsonResponse(500, { message: "nope" }),
      async () => new Response("not-json", { status: 401 }),
      async () => jsonResponse(200, { token: "" }),
      async () => jsonResponse(400, {}),
    ];

    for (const fetchImpl of cases) {
      const result = await loginRequest(
        { email: "ada@example.com", password: "tracker-pass" },
        fetchImpl,
        "http://localhost:4000",
        now,
      );
      expect(result).toEqual({ ok: false, message: LOGIN_SERVICE_UNREACHABLE });
    }
  });

  it("rejects a clock that cannot produce an expiry", async () => {
    const fetchImpl: LoginFetch = async () =>
      jsonResponse(200, {
        token: "signed-token",
        tokenType: "Bearer",
        expiresIn: 300,
        email: "ada@example.com",
      });

    const result = await loginRequest(
      { email: "ada@example.com", password: "tracker-pass" },
      fetchImpl,
      "http://localhost:4000",
      () => new Date(Number.NaN),
    );

    expect(result).toEqual({ ok: false, message: LOGIN_SERVICE_UNREACHABLE });
  });
});
