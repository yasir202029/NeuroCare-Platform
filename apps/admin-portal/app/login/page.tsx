"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { setAccessToken } from "../../lib/session";

type LoginResponse = {
  message?: string;
  error?: { message?: string };
  mfaRequired?: boolean;
  user?: { roles: string[] };
  accessToken?: string | null;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(requiresMfa ? { mfaCode } : {}),
        }),
      });
      const result = (await response.json()) as LoginResponse;

      if (result.mfaRequired) {
        setRequiresMfa(true);
        setError("Enter the six-digit code sent to your email.");
        return;
      }
      if (!response.ok) {
        throw new Error(
          result.error?.message ??
            result.message ??
            "Sign-in failed. Check your details and try again.",
        );
      }
      if (!result.accessToken) {
        throw new Error("Sign-in did not return a session. Try again.");
      }

      setAccessToken(result.accessToken);
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="signin">
      <form className="signin-card" onSubmit={submit}>
        <p className="eyebrow">NeuroCare operations workstation</p>
        <h1>Sign in</h1>
        <p className="muted">
          Operations access is limited to administrative accounts. Every action
          taken here is recorded in the audit trail.
        </p>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <label className="field">
          <span>Work email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {requiresMfa && (
          <label className="field">
            <span>Verification code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value)}
            />
          </label>
        )}

        <div className="follow-up-actions">
          <button className="save" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
