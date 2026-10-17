import { useState } from "react";
import { ArrowRight, ChevronLeft, LockKeyhole, Mail } from "lucide-react";
import { Link } from "wouter";
import { requestMagicLink } from "@/lib/supabase-auth";

type LoginRole = "patient" | "clinician";

export function SupabaseLoginPage({ role }: { role: LoginRole }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const isPatient = role === "patient";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const result = await requestMagicLink(email);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="grain flex min-h-[100dvh] bg-[hsl(var(--secondary)/.42)]">
      <div className="hidden w-[42%] flex-col justify-between bg-[hsl(var(--primary))] p-10 text-[hsl(var(--sidebar-foreground))] lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[hsl(var(--accent))] text-[hsl(var(--primary))]">
            <span className="relative block h-5 w-5 rounded-full border-2 border-current">
              <span className="absolute -right-1 top-1 h-2 w-2 rounded-full bg-current" />
            </span>
          </span>
          <span className="text-[17px] font-semibold">NeuroAssess <span className="font-normal opacity-60">UK</span></span>
        </Link>
        <div>
          <span className="mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">
            NeuroAssess {isPatient ? "patient portal" : "clinical workspace"}
          </span>
          <h1 className="mt-6 max-w-md text-6xl leading-[.98] tracking-[-.055em]">
            A quieter place to keep care moving.
          </h1>
          <p className="mt-6 max-w-sm leading-7 text-[hsl(var(--sidebar-foreground)/.65)]">
            {isPatient
              ? "Your appointments, questionnaires, messages and reports — together, securely."
              : "The focused workspace for thoughtful assessment and coordinated care."}
          </p>
        </div>
        <p className="text-xs text-[hsl(var(--sidebar-foreground)/.45)]">
          Private healthcare, delivered with care.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-12 lg:hidden">
            <Link href="/" className="text-lg font-semibold">NeuroAssess <span className="font-normal opacity-60">UK</span></Link>
          </div>
          {submitted ? (
            <div className="rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                <Mail size={20} />
              </div>
              <h1 className="mt-5 text-2xl">Check your inbox.</h1>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                We have sent a secure sign-in link to {email}.
              </p>
              <button onClick={() => setSubmitted(false)} className="mt-6 text-sm font-semibold text-[hsl(var(--primary))]">
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <p className="mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">
                {isPatient ? "Patient sign in" : "Clinician sign in"}
              </p>
              <h1 className="mt-4 text-4xl tracking-[-.04em]">
                Welcome back, {isPatient ? "Maya" : "Farah"}.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Sign in securely without a password. We will email you a one-time link.
              </p>
              <form onSubmit={submit} className="mt-8 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">
                  Email address
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={isPatient ? "maya@example.com" : "farah@neuroassess.co.uk"}
                    className="rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 font-normal outline-none focus:border-[hsl(var(--primary))]"
                  />
                </label>
                {error && <p className="text-sm text-[hsl(var(--destructive))]" role="alert">{error}</p>}
                <button type="submit" className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))]">
                  Email me a sign-in link <ArrowRight size={16} />
                </button>
              </form>
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <LockKeyhole size={14} /> Secure, passwordless access
              </div>
              <Link href="/" className="mt-10 flex items-center justify-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
                <ChevronLeft size={15} /> Back to NeuroAssess UK
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}