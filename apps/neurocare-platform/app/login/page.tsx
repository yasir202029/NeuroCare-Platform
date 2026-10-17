"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

type LoginResponse = {
  message?: string;
  error?: { message?: string };
  mfaRequired?: boolean;
  methods?: string[];
  user?: { roles: string[] };
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMethods, setMfaMethods] = useState<string[]>([]);
  const [mfaMethod, setMfaMethod] = useState("EMAIL");
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
          ...(requiresMfa ? { mfaCode, mfaMethod } : {}),
        }),
      });
      const result = (await response.json()) as LoginResponse;
      if (result.mfaRequired) {
        setRequiresMfa(true);
        setMfaMethods(result.methods ?? []);
        setMfaMethod(
          result.methods?.includes("EMAIL")
            ? "EMAIL"
            : (result.methods?.[0] ?? "EMAIL"),
        );
        setError(
          result.methods?.includes("EMAIL")
            ? "Enter the six-digit code sent to your email."
            : "Enter the current code from your authenticator app.",
        );
        return;
      }
      if (!response.ok) {
        throw new Error(
          result.error?.message ??
            result.message ??
            "Sign-in failed. Check your details and try again.",
        );
      }

      const roles = result.user?.roles ?? [];
      const destination = roles.includes("ADMIN")
        ? "/admin"
        : roles.includes("PATIENT")
          ? "/patient"
          : "/clinician";
      const requested = new URLSearchParams(window.location.search).get("next");
      window.location.assign(
        requested?.startsWith("/") && !requested.startsWith("//")
          ? requested
          : destination,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The sign-in service is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <Link href="/" className="login-brand">
          NEUROCARE
        </Link>
        <div>
          <p className="login-eyebrow">Secure clinical workspace</p>
          <h1>Care pathways, under the right hands.</h1>
          <p className="login-copy">
            Sign in to reach the patient, clinician or operations workspace
            assigned to your account.
          </p>
        </div>
        <small>Access is role-scoped and audited.</small>
      </section>
      <section className="login-form-wrap">
        <form onSubmit={submit} className="login-form">
          <div>
            <p className="login-eyebrow">Account access</p>
            <h2>Sign in</h2>
          </div>
          <label>
            Email address
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {requiresMfa && (
            <>
              {mfaMethods.length > 1 && (
                <label>
                  Verification method
                  <select
                    value={mfaMethod}
                    onChange={(event) => setMfaMethod(event.target.value)}
                  >
                    {mfaMethods.map((method) => (
                      <option key={method} value={method}>
                        {method === "TOTP" ? "Authenticator app" : "Email"}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Verification code
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value)}
                />
              </label>
            </>
          )}
          {error && (
            <p role="alert" className="login-error">
              {error}
            </p>
          )}
          <button disabled={busy} type="submit">
            {busy
              ? "Signing in…"
              : requiresMfa
                ? "Verify and continue"
                : "Continue securely"}
          </button>
          <Link href="/" className="login-back">
            Back to portal selection
          </Link>
        </form>
      </section>
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
          background: #f1f5f2;
          color: #18352b;
        }
        .login-intro {
          padding: clamp(28px, 7vw, 96px);
          background: #145742;
          color: #f5fff9;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .login-brand,
        .login-back {
          color: inherit;
          text-decoration: none;
          font-weight: 800;
        }
        .login-intro > div {
          max-width: 560px;
          padding: 72px 0;
        }
        .login-eyebrow {
          color: #527566;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .login-intro .login-eyebrow {
          color: #d5eee3;
        }
        h1 {
          max-width: 720px;
          font-size: clamp(40px, 6vw, 72px);
          line-height: 1.02;
          margin: 18px 0;
        }
        h2 {
          margin: 8px 0 0;
          font-size: 32px;
        }
        .login-copy {
          max-width: 440px;
          color: #d5eee3;
          font-size: 17px;
          line-height: 1.65;
        }
        .login-form-wrap {
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .login-form {
          width: min(100%, 420px);
          display: grid;
          gap: 18px;
        }
        .login-form > div .login-eyebrow {
          margin: 0;
        }
        label {
          display: grid;
          gap: 7px;
          font-weight: 700;
        }
        input,
        select {
          min-height: 46px;
          border: 1px solid #c7d8ce;
          background: white;
          padding: 10px 12px;
          font: inherit;
          color: #18352b;
        }
        button {
          border: 0;
          background: #145742;
          color: white;
          padding: 14px 18px;
          font-weight: 800;
          cursor: pointer;
        }
        button:disabled {
          cursor: wait;
          opacity: 0.7;
        }
        .login-error {
          margin: 0;
          color: #9c3f31;
          line-height: 1.5;
        }
        .login-back {
          color: #145742;
        }
        @media (max-width: 700px) {
          .login-page {
            grid-template-columns: 1fr;
          }
          .login-intro {
            min-height: 280px;
          }
          .login-intro > div {
            padding: 44px 0;
          }
          .login-intro h1 {
            font-size: 42px;
          }
        }
      `}</style>
    </main>
  );
}
