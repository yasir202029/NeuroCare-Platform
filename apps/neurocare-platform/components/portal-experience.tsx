"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authenticatedFetch } from "../lib/client-api";

type PortalId =
  "patient" | "clinician" | "titration" | "prescriber" | "finance" | "admin";
type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  clinicianId: string;
};
type Thread = {
  id: string;
  subject?: string | null;
  messages: {
    id: string;
    body: string;
    createdAt: string;
    senderId?: string | null;
  }[];
};
type PatientProfile = {
  id: string;
  medicalHistory?: string | null;
  accessibilityNeeds?: string | null;
};
type Appointment = {
  id: string;
  patientId: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  status: string;
  videoSession?: {
    id: string;
    provider: string;
    waitingRoomOpenedAt?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
  } | null;
  patient?: { id: string; user?: { firstName: string; lastName: string } };
};
type WorkPatient = {
  id: string;
  user: { firstName: string; lastName: string };
  assessments: {
    id: string;
    type: string;
    adhd?: {
      titrationPlans?: {
        id: string;
        status: string;
        targetMedication?: string | null;
      }[];
    } | null;
  }[];
  prescriptions: {
    id: string;
    status: string;
    items: {
      medication: string;
      dose?: string | null;
      strength?: string | null;
    }[];
  }[];
};
type ClinicianWorkspace = { totalPatients: number; patients: WorkPatient[] };
type FinanceData = {
  revenue: Record<string, { amountPence: number; transactions: number }>;
  patients: { new: number; active: number; waitingList: number };
  activity: {
    adhdAssessments: number;
    followUps: number;
    medicationReviews: number;
  };
  outstandingBalancePence: number;
};
type Invoice = {
  id: string;
  status: string;
  totalPence: number;
  createdAt: string;
  dueAt?: string | null;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(path, init);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      result.error?.message ??
        result.message ??
        `Request failed (${response.status})`,
    );
  }
  return result as T;
}

export function PortalExperience({ portal }: { portal: PortalId }) {
  if (portal === "patient") return <PatientExperience />;
  if (portal === "clinician") return <ClinicianExperience />;
  if (portal === "titration") return <TitrationExperience />;
  if (portal === "prescriber") return <PrescriberExperience />;
  if (portal === "finance") return <FinanceExperience />;
  return (
    <Panel
      title="Administration"
      detail="Manage users, queues, permissions and audit activity from the operations command centre."
    >
      <a href="/admin">Open command centre →</a>
    </Panel>
  );
}

function PatientExperience() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [joinLinks, setJoinLinks] = useState<Record<string, string>>({});
  const [slots, setSlots] = useState<Slot[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [slotId, setSlotId] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [concerns, setConcerns] = useState("");
  const [impact, setImpact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    setError("");
    try {
      const from = new Date();
      const to = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
      const [nextProfile, nextAppointments, nextThreads, nextSlots] =
        await Promise.all([
          api<PatientProfile>("/api/v1/patients/me"),
          api<Appointment[]>("/api/v1/booking/appointments"),
          api<Thread[]>("/api/v1/messages"),
          api<Slot[]>(
            `/api/v1/booking/availability?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
          ),
        ]);
      setProfile(nextProfile);
      setMedicalHistory(nextProfile.medicalHistory ?? "");
      setAccessibilityNeeds(nextProfile.accessibilityNeeds ?? "");
      setAppointments(nextAppointments);
      setThreads(nextThreads);
      setThreadId((current) => current || nextThreads[0]?.id || "");
      setSlots(nextSlots);
      setSlotId((current) => current || nextSlots[0]?.id || "");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load your care workspace.",
      );
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/v1/patients/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalHistory, accessibilityNeeds }),
      });
      setNotice("Your care information was saved.");
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not save your information.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendScreening(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/v1/adhd/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrument: "INFORMANT_FORM",
          formKey: "adhd-intake",
          version: "1",
          answers: { concerns, impact },
        }),
      });
      setConcerns("");
      setImpact("");
      setNotice(
        "Your ADHD intake information was submitted to the clinical team.",
      );
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not submit intake information.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function requestAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slot = slots.find((item) => item.id === slotId);
    if (!slot) return setNotice("Choose an available appointment time first.");
    setBusy(true);
    try {
      await api("/api/v1/booking/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADHD",
          mode: slot.mode,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          clinicianId: slot.clinicianId,
          availabilityId: slot.id,
        }),
      });
      setNotice(
        "Appointment request sent. Your team will confirm it in this portal.",
      );
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not request this appointment.",
      );
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function joinRemoteAppointment(appointment: Appointment) {
    if (!appointment.videoSession) return;
    setBusy(true);
    try {
      const result = await api<{ joinUrl?: string; waitingRoom: boolean }>(
        `/api/v1/video/sessions/${appointment.videoSession.id}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantRole: "patient" }),
        },
      );
      if (result.waitingRoom || !result.joinUrl) {
        setNotice("Your clinician has not opened the waiting room yet.");
      } else {
        setJoinLinks((current) => ({
          ...current,
          [appointment.id]: result.joinUrl!,
        }));
        setNotice("Your secure consultation link is ready.");
      }
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not join the remote consultation.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    try {
      await api("/api/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(threadId ? { threadId } : { patientId: profile.id, subject }),
          channel: "IN_APP",
          body: message,
        }),
      });
      setMessage("");
      setSubject("");
      setNotice("Message sent to your care team.");
      const updated = await api<Thread[]>("/api/v1/messages");
      setThreads(updated);
      setThreadId(updated[0]?.id ?? "");
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not send your message.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={gridStyle}>
      <Panel
        title="Your appointments"
        detail="Request an ADHD assessment from current clinic availability."
      >
        <form onSubmit={requestAppointment} style={formStyle}>
          <label>
            Available session
            <select
              required
              value={slotId}
              onChange={(event) => setSlotId(event.target.value)}
              style={fieldStyle}
            >
              <option value="">Select a time</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {dateTime(slot.startsAt)} · {slot.mode.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <button disabled={busy || !slotId} style={primaryButton}>
            Request appointment
          </button>
        </form>
        <RecordList
          empty="No appointments scheduled yet."
          items={appointments.map((item) => ({
            title: dateTime(item.startsAt),
            detail: `${item.status.replace(/_/g, " ")} · ${item.mode.replace(/_/g, " ")}${item.mode === "VIDEO" && !item.videoSession ? " · Room not ready" : ""}`,
            actions: joinLinks[item.id] ? (
              <a
                href={joinLinks[item.id]}
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
              >
                Join consultation ↗
              </a>
            ) : item.videoSession &&
              ["CONFIRMED", "IN_PROGRESS"].includes(item.status) ? (
              <button
                disabled={busy}
                onClick={() => void joinRemoteAppointment(item)}
                style={primaryButton}
              >
                Join video visit
              </button>
            ) : undefined,
          }))}
        />
      </Panel>
      <Panel
        title="Submit ADHD intake"
        detail="Share the concerns and day-to-day impact you want your clinician to understand."
      >
        <form onSubmit={sendScreening} style={formStyle}>
          <label>
            What would you like help with?
            <textarea
              required
              value={concerns}
              onChange={(event) => setConcerns(event.target.value)}
              style={fieldStyle}
              rows={3}
            />
          </label>
          <label>
            How does it affect daily life?
            <textarea
              required
              value={impact}
              onChange={(event) => setImpact(event.target.value)}
              style={fieldStyle}
              rows={3}
            />
          </label>
          <button disabled={busy} style={primaryButton}>
            Submit intake
          </button>
        </form>
      </Panel>
      <Panel
        title="Your information"
        detail="Keep medical history and access needs current for your care team."
      >
        <form onSubmit={saveProfile} style={formStyle}>
          <label>
            Medical history
            <textarea
              value={medicalHistory}
              onChange={(event) => setMedicalHistory(event.target.value)}
              style={fieldStyle}
              rows={3}
            />
          </label>
          <label>
            Accessibility or communication needs
            <textarea
              value={accessibilityNeeds}
              onChange={(event) => setAccessibilityNeeds(event.target.value)}
              style={fieldStyle}
              rows={2}
            />
          </label>
          <button disabled={busy} style={secondaryButton}>
            Save information
          </button>
        </form>
      </Panel>
      <Panel
        title="Message your care team"
        detail="Replies stay in your private in-app conversation."
      >
        {threads.length > 0 && (
          <label>
            Conversation
            <select
              value={threadId}
              onChange={(event) => setThreadId(event.target.value)}
              style={fieldStyle}
            >
              {threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.subject || "Care team message"}
                </option>
              ))}
            </select>
          </label>
        )}
        <ThreadMessages
          thread={threads.find((thread) => thread.id === threadId)}
        />
        <form onSubmit={sendMessage} style={formStyle}>
          {!threadId && (
            <label>
              Subject
              <input
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                style={fieldStyle}
              />
            </label>
          )}
          <label>
            Message
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              style={fieldStyle}
              rows={3}
            />
          </label>
          <button disabled={busy || !profile} style={primaryButton}>
            Send message
          </button>
        </form>
      </Panel>
      {(error || notice) && (
        <Notice error={Boolean(error)}>{error || notice}</Notice>
      )}
    </div>
  );
}

function ClinicianExperience() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [joinLinks, setJoinLinks] = useState<Record<string, string>>({});
  const [slots, setSlots] = useState<Slot[]>([]);
  const [patients, setPatients] = useState<WorkPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [mode, setMode] = useState("VIDEO");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    setError("");
    try {
      const from = new Date();
      const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const [nextAppointments, nextSlots, workspace] = await Promise.all([
        api<Appointment[]>("/api/v1/booking/appointments"),
        api<Slot[]>(
          `/api/v1/booking/availability?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        ),
        api<ClinicianWorkspace>("/api/v1/clinician/workspace"),
      ]);
      setAppointments(nextAppointments);
      setSlots(nextSlots);
      setPatients(workspace.patients);
      setSelectedPatientId(
        (current) => current || workspace.patients[0]?.id || "",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load the clinical workspace.",
      );
    }
  }

  useEffect(() => {
    void reload();
  }, []);
  useEffect(() => {
    if (!selectedPatientId) return setThreads([]);
    void api<Thread[]>(
      `/api/v1/messages?patientId=${encodeURIComponent(selectedPatientId)}`,
    )
      .then((result) => {
        setThreads(result);
        setThreadId((current) =>
          result.some((item) => item.id === current)
            ? current
            : (result[0]?.id ?? ""),
        );
      })
      .catch((reason: unknown) =>
        setNotice(
          reason instanceof Error ? reason.message : "Could not load messages.",
        ),
      );
  }, [selectedPatientId]);

  async function createAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/v1/booking/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          mode,
        }),
      });
      setNotice("Session availability published for patient booking.");
      setStartsAt("");
      setEndsAt("");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not publish availability.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateAppointment(appointment: Appointment, status: string) {
    setBusy(true);
    setError("");
    try {
      const endpoint =
        status === "CANCELLED" || status === "DID_NOT_ATTEND"
          ? `/api/v1/patients/me/appointments/${appointment.id}/status`
          : `/api/v1/booking/appointments/${appointment.id}/status`;
      await api(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "DID_NOT_ATTEND"
            ? { cancellationReason: "Patient did not attend" }
            : {}),
        }),
      });
      setNotice(
        status === "IN_PROGRESS"
          ? "Attendance started and recorded."
          : status === "COMPLETED"
            ? "Appointment marked as completed."
            : `Appointment updated to ${status.replace(/_/g, " ").toLowerCase()}.`,
      );
      await reload();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not update appointment.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createVideoRoom(appointment: Appointment) {
    setBusy(true);
    try {
      await api("/api/v1/video/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          provider: "ZOOM",
        }),
      });
      setNotice("Secure Zoom room created for this appointment.");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not create the video room.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openWaitingRoom(appointment: Appointment) {
    const sessionId = appointment.videoSession?.id;
    if (!sessionId) return;
    setBusy(true);
    try {
      await api(`/api/v1/video/sessions/${sessionId}/waiting-room/open`, {
        method: "POST",
      });
      setNotice("Patient waiting room is open.");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not open the waiting room.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function joinAsClinician(appointment: Appointment) {
    const sessionId = appointment.videoSession?.id;
    if (!sessionId) return;
    setBusy(true);
    try {
      const result = await api<{ joinUrl: string }>(
        `/api/v1/video/sessions/${sessionId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantRole: "clinician" }),
        },
      );
      setJoinLinks((current) => ({
        ...current,
        [appointment.id]: result.joinUrl,
      }));
      setNotice("Host link is ready. Attendance has been recorded.");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not join the video session.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPatientId) return;
    setBusy(true);
    try {
      await api("/api/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(threadId
            ? { threadId }
            : { patientId: selectedPatientId, subject }),
          channel: "IN_APP",
          body: message,
        }),
      });
      setMessage("");
      setSubject("");
      const updated = await api<Thread[]>(
        `/api/v1/messages?patientId=${encodeURIComponent(selectedPatientId)}`,
      );
      setThreads(updated);
      setThreadId(updated[0]?.id ?? "");
      setNotice("Message sent to the patient.");
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Could not send message.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={gridStyle}>
      <Panel
        title="Session scheduler"
        detail="Publish bookable clinical sessions for patient appointments."
      >
        <form onSubmit={createAvailability} style={formStyle}>
          <label>
            Starts
            <input
              required
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              style={fieldStyle}
            />
          </label>
          <label>
            Ends
            <input
              required
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              style={fieldStyle}
            />
          </label>
          <label>
            Mode
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              style={fieldStyle}
            >
              <option value="VIDEO">Video</option>
              <option value="PHONE">Phone</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </label>
          <button disabled={busy || !startsAt || !endsAt} style={primaryButton}>
            Publish availability
          </button>
        </form>
        <RecordList
          empty="No published availability in the next 30 days."
          items={slots.map((slot) => ({
            title: dateTime(slot.startsAt),
            detail: `${slot.mode.replace(/_/g, " ")} · Open for booking`,
          }))}
        />
      </Panel>
      <Panel
        title="Appointments and attendance"
        detail="Confirm requests, start sessions and record attendance outcomes."
      >
        <RecordList
          empty="No appointments assigned to this clinician."
          items={appointments.map((appointment) => ({
            title: `${appointment.patient?.user?.firstName ?? "Patient"} ${appointment.patient?.user?.lastName ?? ""}`,
            detail: `${dateTime(appointment.startsAt)} · ${appointment.status.replace(/_/g, " ")}`,
            actions: (
              <div style={actionStyle}>
                {appointment.status === "REQUESTED" && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void updateAppointment(appointment, "CONFIRMED")
                    }
                    style={secondaryButton}
                  >
                    Confirm
                  </button>
                )}
                {appointment.status === "CONFIRMED" && (
                  <>
                    {appointment.mode === "VIDEO" &&
                      !appointment.videoSession && (
                        <button
                          disabled={busy}
                          onClick={() => void createVideoRoom(appointment)}
                          style={primaryButton}
                        >
                          Create Zoom room
                        </button>
                      )}
                    {appointment.mode === "VIDEO" &&
                      appointment.videoSession &&
                      !appointment.videoSession.waitingRoomOpenedAt && (
                        <button
                          disabled={busy}
                          onClick={() => void openWaitingRoom(appointment)}
                          style={primaryButton}
                        >
                          Open patient waiting room
                        </button>
                      )}
                    {appointment.mode === "VIDEO" &&
                      appointment.videoSession && (
                        <button
                          disabled={busy}
                          onClick={() => void joinAsClinician(appointment)}
                          style={secondaryButton}
                        >
                          Get host link
                        </button>
                      )}
                    {appointment.mode !== "VIDEO" && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void updateAppointment(appointment, "IN_PROGRESS")
                        }
                        style={primaryButton}
                      >
                        Start / attended
                      </button>
                    )}
                    <button
                      disabled={busy}
                      onClick={() =>
                        void updateAppointment(appointment, "DID_NOT_ATTEND")
                      }
                      style={secondaryButton}
                    >
                      Did not attend
                    </button>
                  </>
                )}
                {appointment.status === "IN_PROGRESS" && (
                  <>
                    {appointment.mode === "VIDEO" &&
                      appointment.videoSession && (
                        <button
                          disabled={busy}
                          onClick={() => void joinAsClinician(appointment)}
                          style={secondaryButton}
                        >
                          Reopen host link
                        </button>
                      )}
                    <button
                      disabled={busy}
                      onClick={() =>
                        void updateAppointment(appointment, "COMPLETED")
                      }
                      style={primaryButton}
                    >
                      Complete session
                    </button>
                  </>
                )}
                {joinLinks[appointment.id] && (
                  <a
                    href={joinLinks[appointment.id]}
                    target="_blank"
                    rel="noreferrer"
                    style={linkStyle}
                  >
                    Join Zoom host ↗
                  </a>
                )}
              </div>
            ),
          }))}
        />
      </Panel>
      <Panel
        title="Patient messages"
        detail="Read assigned-patient conversations and reply from the clinical workspace."
      >
        <label>
          Patient
          <select
            value={selectedPatientId}
            onChange={(event) => setSelectedPatientId(event.target.value)}
            style={fieldStyle}
          >
            <option value="">Select assigned patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.user.firstName} {patient.user.lastName}
              </option>
            ))}
          </select>
        </label>
        {threads.length > 0 && (
          <label>
            Conversation
            <select
              value={threadId}
              onChange={(event) => setThreadId(event.target.value)}
              style={fieldStyle}
            >
              {threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.subject || "Care team message"}
                </option>
              ))}
            </select>
          </label>
        )}
        <ThreadMessages
          thread={threads.find((thread) => thread.id === threadId)}
        />
        <form onSubmit={sendMessage} style={formStyle}>
          {!threadId && (
            <label>
              Subject
              <input
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                style={fieldStyle}
              />
            </label>
          )}
          <label>
            Reply
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              style={fieldStyle}
              rows={3}
            />
          </label>
          <button disabled={busy || !selectedPatientId} style={primaryButton}>
            Send reply
          </button>
        </form>
      </Panel>
      {(error || notice) && (
        <Notice error={Boolean(error)}>{error || notice}</Notice>
      )}
    </div>
  );
}

function TitrationExperience() {
  const [workspace, setWorkspace] = useState<ClinicianWorkspace | null>(null);
  const [assessmentId, setAssessmentId] = useState("");
  const [medication, setMedication] = useState("");
  const [dose, setDose] = useState("");
  const [response, setResponse] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function reload() {
    try {
      setWorkspace(
        await api<ClinicianWorkspace>("/api/v1/clinician/workspace"),
      );
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load assigned titration cases.",
      );
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  const cases =
    workspace?.patients.flatMap((patient) =>
      patient.assessments
        .filter((assessment) => assessment.type === "ADHD")
        .map((assessment) => ({ patient, assessment })),
    ) ?? [];
  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(`/api/v1/adhd/assessments/${assessmentId}/medication-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication, dose, response, sideEffects }),
      });
      setMedication("");
      setDose("");
      setResponse("");
      setSideEffects("");
      setNotice("Medication review added to the ADHD record.");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not save medication review.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={gridStyle}>
      <Panel
        title="Active titration cases"
        detail="Review assigned ADHD pathways, medication progress and tolerability."
      >
        <RecordList
          empty="No assigned ADHD assessments are available."
          items={cases.map(({ patient, assessment }) => ({
            title: `${patient.user.firstName} ${patient.user.lastName}`,
            detail:
              assessment.adhd?.titrationPlans
                ?.map(
                  (plan) =>
                    `${plan.status.replace(/_/g, " ")}${plan.targetMedication ? `: ${plan.targetMedication}` : ""}`,
                )
                .join(" · ") || "No medication plan yet",
          }))}
        />
      </Panel>
      <Panel
        title="Record medication review"
        detail="Document response and side effects for an assigned ADHD assessment."
      >
        <form onSubmit={saveReview} style={formStyle}>
          <label>
            Assigned assessment
            <select
              required
              value={assessmentId}
              onChange={(event) => setAssessmentId(event.target.value)}
              style={fieldStyle}
            >
              <option value="">Select assessment</option>
              {cases.map(({ patient, assessment }) => (
                <option key={assessment.id} value={assessment.id}>
                  {patient.user.firstName} {patient.user.lastName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Medication
            <input
              required
              value={medication}
              onChange={(event) => setMedication(event.target.value)}
              style={fieldStyle}
            />
          </label>
          <label>
            Dose
            <input
              value={dose}
              onChange={(event) => setDose(event.target.value)}
              style={fieldStyle}
            />
          </label>
          <label>
            Response
            <textarea
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              style={fieldStyle}
              rows={2}
            />
          </label>
          <label>
            Side effects
            <textarea
              value={sideEffects}
              onChange={(event) => setSideEffects(event.target.value)}
              style={fieldStyle}
              rows={2}
            />
          </label>
          <button disabled={busy || !assessmentId} style={primaryButton}>
            Save medication review
          </button>
        </form>
      </Panel>
      {(error || notice) && (
        <Notice error={Boolean(error)}>{error || notice}</Notice>
      )}
    </div>
  );
}

function PrescriberExperience() {
  const [workspace, setWorkspace] = useState<ClinicianWorkspace | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  async function reload() {
    try {
      setWorkspace(
        await api<ClinicianWorkspace>("/api/v1/clinician/workspace"),
      );
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load prescription reviews.",
      );
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  const prescriptions =
    workspace?.patients.flatMap((patient) =>
      patient.prescriptions.map((prescription) => ({ patient, prescription })),
    ) ?? [];
  async function sign(prescriptionId: string) {
    setBusyId(prescriptionId);
    try {
      await api(`/api/v1/clinician/prescriptions/${prescriptionId}/sign`, {
        method: "POST",
      });
      setNotice("Prescription signed and audit history updated.");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not sign prescription.",
      );
    } finally {
      setBusyId("");
    }
  }
  return (
    <div style={gridStyle}>
      <Panel
        title="Prescription review queue"
        detail="Review medications attached to assigned patient records before signing."
      >
        <RecordList
          empty="No assigned prescriptions are awaiting review."
          items={prescriptions.map(({ patient, prescription }) => ({
            title: `${patient.user.firstName} ${patient.user.lastName}`,
            detail: `${prescription.items.map((item) => item.medication).join(", ") || "Medication details pending"} · ${prescription.status.replace(/_/g, " ")}`,
            actions:
              prescription.status === "PENDING_SIGNATURE" ? (
                <button
                  disabled={busyId === prescription.id}
                  onClick={() => void sign(prescription.id)}
                  style={primaryButton}
                >
                  {busyId === prescription.id
                    ? "Signing…"
                    : "Sign prescription"}
                </button>
              ) : undefined,
          }))}
        />
      </Panel>
      {(error || notice) && (
        <Notice error={Boolean(error)}>{error || notice}</Notice>
      )}
    </div>
  );
}

function FinanceExperience() {
  const [dashboard, setDashboard] = useState<FinanceData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function reload() {
    try {
      const [nextDashboard, nextInvoices] = await Promise.all([
        api<FinanceData>("/api/v1/finance/dashboard"),
        api<Invoice[]>("/api/v1/billing/invoices"),
      ]);
      setDashboard(nextDashboard);
      setInvoices(nextInvoices);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load finance workspace.",
      );
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  async function checkout(invoiceId: string) {
    try {
      const result = await api<{ url?: string; session?: { url?: string } }>(
        `/api/v1/billing/invoices/${invoiceId}/checkout`,
        { method: "POST" },
      );
      const url = result.url ?? result.session?.url;
      if (url) window.location.assign(url);
      else
        setNotice("Checkout session created but no payment URL was returned.");
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not start invoice payment.",
      );
    }
  }
  return (
    <div style={gridStyle}>
      <Panel
        title="Service performance"
        detail="Live activity and revenue from the current finance period."
      >
        <div style={metricGridStyle}>
          <Metric label="New patients" value={dashboard?.patients.new} />
          <Metric label="Active patients" value={dashboard?.patients.active} />
          <Metric
            label="Waiting list"
            value={dashboard?.patients.waitingList}
          />
          <Metric
            label="Outstanding"
            value={
              dashboard ? pounds(dashboard.outstandingBalancePence) : undefined
            }
          />
          <Metric
            label="ADHD assessments"
            value={dashboard?.activity.adhdAssessments}
          />
          <Metric
            label="Medication reviews"
            value={dashboard?.activity.medicationReviews}
          />
        </div>
      </Panel>
      <Panel
        title="Invoices and payments"
        detail="Open an invoice checkout or review recent account activity."
      >
        <RecordList
          empty="No invoices are available for this account."
          items={invoices.map((invoice) => ({
            title: pounds(invoice.totalPence),
            detail: `${invoice.status.replace(/_/g, " ")} · ${new Date(invoice.createdAt).toLocaleDateString()}`,
            actions: ["OPEN", "OVERDUE"].includes(invoice.status) ? (
              <button
                onClick={() => void checkout(invoice.id)}
                style={primaryButton}
              >
                Pay invoice
              </button>
            ) : undefined,
          }))}
        />
      </Panel>
      {(error || notice) && (
        <Notice error={Boolean(error)}>{error || notice}</Notice>
      )}
    </div>
  );
}

function Panel({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section style={panelStyle}>
      <header style={{ display: "grid", gap: 6, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>{title}</h2>
        <p style={{ margin: 0, color: "#63776f", lineHeight: 1.5 }}>{detail}</p>
      </header>
      {children}
    </section>
  );
}

function RecordList({
  empty,
  items,
}: {
  empty: string;
  items: { title: string; detail: string; actions?: React.ReactNode }[];
}) {
  if (!items.length)
    return <p style={{ color: "#63776f", margin: "16px 0 0" }}>{empty}</p>;
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
      {items.map((item, index) => (
        <article key={`${item.title}-${index}`} style={recordStyle}>
          <div>
            <strong>{item.title}</strong>
            <p style={{ margin: "4px 0 0", color: "#63776f", fontSize: 13 }}>
              {item.detail}
            </p>
          </div>
          {item.actions}
        </article>
      ))}
    </div>
  );
}

function ThreadMessages({ thread }: { thread?: Thread }) {
  if (!thread) return null;
  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        maxHeight: 230,
        overflowY: "auto",
        padding: "4px 0",
      }}
    >
      {thread.messages.map((item) => (
        <article key={item.id} style={{ background: "#f4f8f5", padding: 10 }}>
          <small style={{ color: "#63776f" }}>
            {new Date(item.createdAt).toLocaleString()}
          </small>
          <p style={{ margin: "5px 0 0", whiteSpace: "pre-wrap" }}>
            {item.body}
          </p>
        </article>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: string | number }) {
  return (
    <div style={metricStyle}>
      <small style={{ color: "#63776f" }}>{label}</small>
      <strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>
        {value ?? "—"}
      </strong>
    </div>
  );
}

function Notice({
  children,
  error,
}: {
  children: React.ReactNode;
  error: boolean;
}) {
  return (
    <p
      role={error ? "alert" : "status"}
      style={{
        ...noticeStyle,
        background: error ? "#fff3ef" : "#edf6f0",
        color: error ? "#8d3929" : "#145742",
      }}
    >
      {children}
    </p>
  );
}

function dateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function pounds(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value / 100);
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 390px), 1fr))",
  gap: 18,
  marginTop: 24,
};
const panelStyle = {
  background: "#fff",
  border: "1px solid #dce5e0",
  padding: 20,
  display: "grid",
  alignContent: "start",
  gap: 12,
};
const formStyle = { display: "grid", gap: 12 };
const fieldStyle = {
  display: "block",
  width: "100%",
  minHeight: 42,
  border: "1px solid #cbd9d2",
  background: "#fff",
  color: "#18352b",
  padding: "9px 11px",
  marginTop: 6,
  font: "inherit",
};
const primaryButton = {
  border: 0,
  background: "#176550",
  color: "#fff",
  fontWeight: 750,
  padding: "11px 14px",
  cursor: "pointer",
  justifySelf: "start",
};
const linkStyle = { color: "#145742", fontWeight: 750, textDecoration: "none" };
const secondaryButton = {
  border: "1px solid #cbd9d2",
  background: "#fff",
  color: "#145742",
  fontWeight: 700,
  padding: "9px 12px",
  cursor: "pointer",
  justifySelf: "start",
};
const actionStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
  marginTop: 10,
};
const recordStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: 12,
  borderTop: "1px solid #e5ece8",
  padding: "12px 0",
};
const metricGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 10,
};
const metricStyle = { background: "#f4f8f5", padding: 14 };
const noticeStyle = {
  gridColumn: "1 / -1",
  border: "1px solid #dce5e0",
  padding: 13,
  margin: 0,
};
