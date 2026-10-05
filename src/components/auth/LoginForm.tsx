"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LOGIN_SERVICE_UNREACHABLE, loginRequest } from "@/lib/auth/login";
import {
  clearSession,
  getBrowserSession,
  saveSession,
  subscribeSession,
} from "@/lib/auth/session";

type FieldErrors = {
  email?: string;
  password?: string;
};

function placeError(message: string): { fields: FieldErrors; form?: string } {
  const normalized = message.toLowerCase();
  const aboutEmail = normalized.includes("email");
  const aboutPassword = normalized.includes("password");

  if (aboutEmail && !aboutPassword) return { fields: { email: message } };
  if (aboutPassword && !aboutEmail) return { fields: { password: message } };
  return { fields: {}, form: message };
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const session = useSyncExternalStore(subscribeSession, getBrowserSession, () => null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  function resetErrors() {
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;

    pendingRef.current = true;
    setPending(true);
    resetErrors();

    try {
      const result = await loginRequest({ email, password });
      if (!result.ok) {
        const placed = placeError(result.message);
        setFieldErrors(placed.fields);
        setFormError(placed.form ?? null);
        return;
      }

      saveSession(result.session);
      setPassword("");
    } catch {
      setFormError(LOGIN_SERVICE_UNREACHABLE);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  function handleSignOut() {
    clearSession();
    setPassword("");
    resetErrors();
  }

  if (session) {
    return (
      <div className="card flex flex-col gap-4">
        <h2 className="heading2">Signed in</h2>
        <p className="body1">{session.email}</p>
        <p className="body1">This sign-in expires in 5 minutes.</p>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <form className="card flex flex-col gap-4" noValidate aria-busy={pending} onSubmit={handleSubmit}>
      <p className="body2">Demo account: ada@example.com / tracker-pass</p>

      {formError ? (
        <p className="alert" role="alert">
          {formError}
        </p>
      ) : null}

      <TextField
        id="login-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        error={fieldErrors.email}
        disabled={pending}
        onChange={(value) => {
          setEmail(value);
          setFieldErrors((current) => ({ ...current, email: undefined }));
          setFormError(null);
        }}
      />
      <TextField
        id="login-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        error={fieldErrors.password}
        disabled={pending}
        onChange={(value) => {
          setPassword(value);
          setFieldErrors((current) => ({ ...current, password: undefined }));
          setFormError(null);
        }}
      />

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        Sign in
      </Button>
    </form>
  );
}
