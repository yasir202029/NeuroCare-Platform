"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../../lib/client-api";
import FeatureGate from "@/components/FeatureGate";

type AvailabilitySlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  clinicianId: string | null;
  clinician?: { user: { firstName: string; lastName: string; email: string } };
};

type Appointment = {
  id: string;
  type: string;
  mode: string;
  startsAt: string;
  endsAt: string;
  status: string;
  clinician?: { user: { firstName: string; lastName: string } };
};

function FeatureDisabled() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
        Self-booking disabled
      </h2>
      <p style={{ fontSize: 14, marginBottom: 16 }}>
        Patient self-booking is not available for your account. Please contact the
        clinic to schedule an appointment.
      </p>
    </div>
  );
}

export default function PatientBookingPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 86400000);
    setFromDate(now.toISOString().slice(0, 10));
    setToDate(nextWeek.toISOString().slice(0, 10));
    loadSlots();
    loadAppointments();
  }, []);

  async function loadSlots() {
    if (!fromDate || !toDate) return;
    try {
      const res = await authenticatedFetch(
        `/api/v1/booking/availability?from=${fromDate}T00:00:00Z&to=${toDate}T23:59:59Z`,
      );
      if (res.ok) setSlots(await res.json());
    } catch {
      setError("Failed to load available slots.");
    }
  }

  async function loadAppointments() {
    try {
      const res = await authenticatedFetch("/api/v1/booking/appointments");
      if (res.ok) setAppointments(await res.json());
    } catch {
      setError("Failed to load appointments.");
    }
  }

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) return;
    setBusy(true);
    setError(null);
    try {
      const res = await authenticatedFetch("/api/v1/booking/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADHD",
          mode: selectedSlot.mode,
          startsAt: selectedSlot.startsAt,
          endsAt: selectedSlot.endsAt,
          availabilityId: selectedSlot.id,
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      const data = await res.json();
      setSuccess(`Appointment booked for ${new Date(data.startsAt).toLocaleString()}.`);
      setSelectedSlot(null);
      setBusy(false);
      await loadAppointments();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Booking failed.");
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      const res = await authenticatedFetch(
        `/api/v1/booking/patients/me/appointments/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        },
      );
      if (!res.ok) throw new Error("Cancellation failed");
      await loadAppointments();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cancellation failed.");
    }
  }

  return (
    <FeatureGate feature="patient_self_book" fallback={<FeatureDisabled />}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px clamp(20px, 5vw, 64px) 56px" }}>
        <Link href="/patient" style={{ textDecoration: "none", color: "#64748b", marginBottom: 24, display: "inline-block" }}>
          ← Back to patient portal
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Book an appointment</h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          Choose an available slot and confirm your assessment appointment.
        </p>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: 12, borderRadius: 8, marginTop: 16, fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: 12, borderRadius: 8, marginTop: 16, fontSize: 13 }}>
            {success}
          </div>
        )}
        <section style={{ marginTop: 32, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>Available slots</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>From date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit", width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>To date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, font: "inherit", width: "100%" }} />
            </div>
            <button onClick={loadSlots} disabled={loading} style={{
              background: "#4e6ef2", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 800, cursor: "pointer", font: "inherit", width: "100%"
            }}>
              {loading ? "Loading…" : "Refresh slots"}
            </button>
          </div>
          {loading && <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>Loading slots…</div>}
          {slots.length === 0 && !loading && (
            <p style={{ marginTop: 16, color: "#64748b" }}>
              No available slots in the selected date range. Try a different range.
            </p>
          )}
          <div style={{ marginTop: 20 }}>
            {slots.map((slot) => {
              const starts = new Date(slot.startsAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
              const ends = new Date(slot.endsAt).toLocaleString([], { hour: "2-digit", minute: "2-digit" });
              const clinicianName = slot.clinician?.user ? `${slot.clinician.user.firstName} ${slot.clinician.user.lastName}` : "TBC";
              return (
                <div key={slot.id} onClick={() => setSelectedSlot(selectedSlot?.id === slot.id ? null : slot)} style={{ border: `1px solid ${selectedSlot?.id === slot.id ? "#4e6ef2" : "#e2e8f0"}`, borderRadius: 10, padding: 16, background: selectedSlot?.id === slot.id ? "#eef4ff" : "#fff", cursor: "pointer", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#15233a" }}>{starts} – {ends}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{slot.mode === "VIDEO" ? "📹 Video consultation" : "📍 In-person"}&nbsp;·&nbsp; {clinicianName}</div>
                    </div>
                    {selectedSlot?.id === slot.id ? <div style={{ fontSize: 11, fontWeight: 800, color: "#4e6ef2", background: "#eef4ff", padding: "4px 8px", borderRadius: 6 }}>Selected</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {selectedSlot && (
          <section style={{ marginTop: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>Confirm booking</h2>
            <p style={{ color: "#64748b", margin: "0 0 16px" }}>
              You are booking a <strong>{selectedSlot.mode}</strong> appointment on{" "}
              <strong>{new Date(selectedSlot.startsAt).toLocaleString()}</strong>.
            </p>
            <form onSubmit={book}>
              <button type="submit" disabled={busy} style={{
                background: busy ? "#94a3b8" : "#4e6ef2", color: "#fff", border: "none",
                borderRadius: 8, padding: "12px 24px", fontWeight: 800, cursor: busy ? "not-allowed" : "pointer",
                font: "inherit", fontSize: 15,
              }}>
                {busy ? "Booking…" : "Confirm appointment"}
              </button>
              <button type="button" onClick={() => setSelectedSlot(null)} style={{
                background: "none", border: "1px solid #cbd5e1", color: "#64748b",
                borderRadius: 8, padding: "12px 24px", fontWeight: 800, cursor: "pointer",
                font: "inherit", fontSize: 15, marginLeft: 10,
              }}>
                Cancel
              </button>
            </form>
          </section>
        )}
        <section style={{ marginTop: 32, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>Your appointments</h2>
          {appointments.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              No appointments yet. Book one above to get started.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {appointments.map((a) => (
                <div key={a.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#15233a" }}>
                        {new Date(a.startsAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {a.mode === "VIDEO" ? "📹 Video" : "📍 In-person"} &nbsp;·&nbsp; {a.clinician?.user?.firstName ?? "Clinician"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase", padding: "2px 8px",
                        borderRadius: 6, background: a.status === "REQUESTED" ? "#fef3f7" : "#e2e8f0",
                        color: a.status === "REQUESTED" ? "#dc2626" : "#64748b",
                      }}>
                        {a.status}
                      </span>
                      {a.status === "REQUESTED" && (
                        <button onClick={() => cancel(a.id)} style={{
                          background: "none", border: "none", color: "#dc2626",
                          fontSize: 12, fontWeight: 700, cursor: "pointer", font: "inherit",
                        }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </FeatureGate>
  );
}