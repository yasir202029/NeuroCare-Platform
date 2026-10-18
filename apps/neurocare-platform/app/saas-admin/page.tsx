"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../lib/client-api";

type Plan = {
  id: string;
  key: string;
  name: string;
  tier: string;
  description?: string | null;
  pricePence: number;
  interval: string;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  active: boolean;
};

type Org = {
  id: string;
  key: string;
  name: string;
  tier: string;
  plan?: Plan | null;
  members: any[];
  usageMeters: any[];
  apiKeys: any[];
  subscriptionInvoices: any[];
  trialRecords: any[];
};

type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  rolloutPct: number;
};

const pounds = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value / 100);

export default function SaaSAdminPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/v1/saas/plans"),
      authenticatedFetch("/api/v1/saas/feature-flags"),
    ])
      .then(async ([pRes, fRes]) => {
        if (!active) return;
        if (pRes.ok) setPlans(await pRes.json());
        if (fRes.ok) setFlags(await fRes.json());
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadOrgs() {
    try {
      const res = await authenticatedFetch("/api/v1/admin/organizations");
      if (res.ok) setOrgs(await res.json());
    } catch {
      // Admin endpoint may not exist yet, try empty
      setOrgs([]);
    }
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const res = await authenticatedFetch("/api/v1/saas/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: formData.get("key"),
          name: formData.get("name"),
          tier: formData.get("tier"),
          description: formData.get("description"),
          pricePence: Number(formData.get("pricePence")),
          interval: formData.get("interval"),
          features: {},
          limits: {},
        }),
      });
      if (!res.ok) throw new Error("Failed to create plan");
      const newPlan = await res.json();
      setPlans((prev) => [...prev, newPlan]);
      event.currentTarget.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to create plan.");
    }
  }

  async function setFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const res = await authenticatedFetch("/api/v1/saas/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: formData.get("key"),
          name: formData.get("name"),
          description: formData.get("description"),
          enabled: formData.get("enabled") === "true",
          rolloutPct: Number(formData.get("rolloutPct") || 0),
        }),
      });
      if (!res.ok) throw new Error("Failed to set feature flag");
      const newFlag = await res.json();
      setFlags((prev) => [...prev, newFlag]);
      event.currentTarget.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to set feature flag.");
    }
  }

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
          <Link href="/admin" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
            NEUROCARE
          </Link>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>
            SaaS Administration · Multi-tenant Platform
          </p>
        </div>
        <Link
          href="/admin"
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
          ← Back to Admin
        </Link>
      </header>

      <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 12px", letterSpacing: -0.02 }}>
        SaaS Administration
      </h1>
      <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.6, marginBottom: 32, maxWidth: 800 }}>
        Manage subscription plans, organizations, feature flags, and API keys.
        Control access, usage limits, and platform rollout for your ADHD clinic network.
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

      {/* Subscription Plans */}
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
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Subscription Plans
          </h2>
        </div>
        <form onSubmit={createPlan} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Plan Key
            <input name="key" required style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Plan Name
            <input name="name" required style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Tier
            <select name="tier" style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }}>
              <option value="STARTER">Starter</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Price (pence)
            <input name="pricePence" type="number" required style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Interval
            <select name="interval" style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }}>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </label>
          <button style={{
            background: "#4e6ef2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontWeight: 800,
            cursor: "pointer",
            font: "inherit",
          }}>
            Create Plan
          </button>
        </form>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#64748b", fontWeight: 800, textTransform: "uppercase", fontSize: 11, borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "12px 16px" }}>Plan</th>
                <th style={{ padding: "12px 16px" }}>Tier</th>
                <th style={{ padding: "12px 16px" }}>Price</th>
                <th style={{ padding: "12px 16px" }}>Interval</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No plans defined. Create your first subscription plan above.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{plan.name}</td>
                    <td style={{ padding: "12px 16px" }}>{plan.tier}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800 }}>{pounds(plan.pricePence)}</td>
                    <td style={{ padding: "12px 16px" }}>{plan.interval}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: plan.active ? "#16a34a" : "#64748b" }}>
                        {plan.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature Flags */}
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Feature Flags
          </h2>
        </div>
        <form onSubmit={setFlag} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Flag Key
            <input name="key" required style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Flag Name
            <input name="name" required style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Description
            <input name="description" style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Rollout %
            <input name="rolloutPct" type="number" min="0" max="100" defaultValue="0" style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Enabled
            <select name="enabled" style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit" }}>
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </label>
          <button style={{
            background: "#4e6ef2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontWeight: 800,
            cursor: "pointer",
            font: "inherit",
          }}>
            Set Flag
          </button>
        </form>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#64748b", fontWeight: 800, textTransform: "uppercase", fontSize: 11, borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "12px 16px" }}>Flag</th>
                <th style={{ padding: "12px 16px" }}>Enabled</th>
                <th style={{ padding: "12px 16px" }}>Rollout</th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No feature flags defined.
                  </td>
                </tr>
              ) : (
                flags.map((flag) => (
                  <tr key={flag.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{flag.key}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: flag.enabled ? "#16a34a" : "#64748b" }}>
                        {flag.enabled ? "On" : "Off"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{flag.rolloutPct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
