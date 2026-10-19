"use client";

import { useEffect, useState } from "react";
import { PatientShell } from "../../components/patient-shell";
import { getPatientProfile, type PatientProfile } from "../../lib/patient-api";

export function PatientDashboardClient() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getPatientProfile()
      .then((data) => { if (mounted) { setProfile(data); setLoading(false); } })
      .catch((err) => { if (mounted) { setError(err.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <h1 className="text-3xl font-bold text-slate-900">Patient Portal</h1>
        <p className="text-slate-600 mt-4">Loading your care record…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <h1 className="text-3xl font-bold text-slate-900">Patient Portal</h1>
        <p className="text-slate-600 mt-4">{error}</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <h1 className="text-3xl font-bold text-slate-900">Patient Portal</h1>
        <p className="text-slate-600 mt-4">No patient profile found.</p>
      </main>
    );
  }

  return (
    <PatientShell>
      <section className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Care Record</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Profile</h3>
            <p className="text-sm text-slate-600">{profile.user.firstName} {profile.user.lastName}</p>
            <p className="text-sm text-slate-600">{profile.user.email}</p>
            {profile.user.phone && <p className="text-sm text-slate-600">{profile.user.phone}</p>}
            {profile.dateOfBirth && <p className="text-sm text-slate-600">DOB: {new Date(profile.dateOfBirth).toLocaleDateString()}</p>}
            {profile.gender && <p className="text-sm text-slate-600">Gender: {profile.gender}</p>}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Contact Preferences</h3>
            <p className="text-sm text-slate-600">
              {profile.consentToContact ? "Consent to contact: Yes" : "Consent to contact: No"}
            </p>
            {profile.preferredContact && <p className="text-sm text-slate-600">Preferred: {profile.preferredContact}</p>}
            {profile.accessibilityNeeds && (
              <>
                <p className="text-sm text-slate-600 font-medium mb-1">Accessibility needs:</p>
                <p className="text-sm text-slate-600">{profile.accessibilityNeeds}</p>
              </>
            )}
          </div>
        </div>
        {profile.medicalHistory && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-2">Medical History</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{profile.medicalHistory}</p>
          </div>
        )}
        {profile.currentMedication && profile.currentMedication.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-2">Current Medication</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              {profile.currentMedication.map((med, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-8">{i + 1}.</span>
                  <span>{JSON.stringify(med)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </PatientShell>
  );
}
