"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../lib/client-api";

type JourneyStep = {
  id: string;
  label: string;
  stage: string;
  required: boolean;
};

type OnboardingState = {
  patientId: string;
  stage: string;
  nextStage: string;
  completion: number;
  canBookAppointment: boolean;
};

export default function OnboardingPage() {
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    nhsNumber: string;
    dateOfBirth: string;
    sexAtBirth: string;
    gender: string;
    address: string;
    emergencyContact: string;
    medicalHistory: string;
    accessibilityNeeds: string;
  }>({
    nhsNumber: "",
    dateOfBirth: "",
    sexAtBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    medicalHistory: "",
    accessibilityNeeds: "",
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/v1/onboarding/journey-steps"),
      authenticatedFetch("/api/v1/onboarding/state"),
    ])
      .then(async ([stepsRes, stateRes]) => {
        if (!active) return;
        if (stepsRes.ok) setSteps((await stepsRes.json()) as JourneyStep[]);
        if (stateRes.ok) setState((await stateRes.json()) as OnboardingState);
        setLoading(false);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Failed to load onboarding.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const res = await authenticatedFetch("/api/v1/onboarding/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nhsNumber: profile.nhsNumber || undefined,
          dateOfBirth: profile.dateOfBirth || undefined,
          sexAtBirth: profile.sexAtBirth || undefined,
          gender: profile.gender || undefined,
          medicalHistory: profile.medicalHistory || undefined,
          accessibilityNeeds: profile.accessibilityNeeds || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      // Refresh state
      const stateRes = await authenticatedFetch("/api/v1/onboarding/state");
      if (stateRes.ok) setState((await stateRes.json()) as OnboardingState);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to update profile.");
    }
  }

  const stageColors: Record<string, string> = {
    NOT_STARTED: "#64748b",
    IDENTITY_VERIFIED: "#4e6ef2",
    DEMOGRAPHICS_COMPLETE: "#4e6ef2",
    CONTACT_COMPLETE: "#4e6ef2",
    MEDICAL_HISTORY_COMPLETE: "#4e6ef2",
    COMPLETED: "#16a34a",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        color: "#0f172a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "24px clamp(20px, 5vw, 64px) 56px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <Link href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
            NEUROCARE
          </Link>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>
            Patient Onboarding · Progressive Profiling
          </p>
        </div>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            background: "#ffffff",
            color: "#1e293b",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          ← Back to Home
        </Link>
      </header>

      <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 12px", letterSpacing: -0.02 }}>
        Patient Onboarding
      </h1>
      <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.6, marginBottom: 32, maxWidth: 800 }}>
        Complete your profile progressively. Each section unlocks the next step in your ADHD care journey.
        All data is stored securely and used only for your clinical care.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 24,
            padding: "12px 16px",
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* Progress */}
      {state && (
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
                Onboarding Progress
              </h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                {state.stage.replace(/_/g, " ")} · {state.canBookAppointment ? "You can book appointments" : "Complete profile to book"}
              </p>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#4e6ef2" }}>
              {state.completion}%
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              background: "#e2e8f0",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${state.completion}%`,
                height: "100%",
                background: "#4e6ef2",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </section>
      )}

      {/* Journey Steps */}
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
          Journey Steps
        </h2>
        <div style={{ display: "grid", gap: 10 }}>
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                border: "1px solid #f1f5f9",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: stageColors[step.stage] ?? "#64748b",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {step.id.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{step.label}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {step.required ? "Required" : "Optional"} · {step.stage.replace(/_/g, " ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Profile Form */}
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
          Your Profile
        </h2>
        <form onSubmit={updateProfile} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            NHS Number
            <input
              required
              maxLength={10}
              value={profile.nhsNumber}
              onChange={(e) => setProfile((prev) => ({ ...prev, nhsNumber: e.target.value }))}
              placeholder="1234567890"
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Date of Birth
            <input
              required
              type="date"
              value={profile.dateOfBirth}
              onChange={(e) => setProfile((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Sex at Birth
            <input
              required
              value={profile.sexAtBirth}
              onChange={(e) => setProfile((prev) => ({ ...prev, sexAtBirth: e.target.value }))}
              placeholder=""
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Gender
            <input
              required
              value={profile.gender}
              onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))}
              placeholder=""
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155", gridColumn: "span 2" }}>
            Medical History
            <textarea
              value={profile.medicalHistory}
              onChange={(e) => setProfile((prev) => ({ ...prev, medicalHistory: e.target.value }))}
              rows={3}
              placeholder="Any relevant medical history..."
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155", gridColumn: "span 2" }}>
            Accessibility Needs
            <textarea
              value={profile.accessibilityNeeds}
              onChange={(e) => setProfile((prev) => ({ ...prev, accessibilityNeeds: e.target.value }))}
              rows={2}
              placeholder="Any accessibility requirements..."
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              gridColumn: "span 2",
              background: "#4e6ef2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontWeight: 800,
              cursor: "pointer",
              font: "inherit",
            }}
          >
            Save Profile
          </button>
        </form>
      </section>
    </div>
  );
}
