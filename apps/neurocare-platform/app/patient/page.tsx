import type { Metadata } from "next";
import { PatientDashboardClient } from "./patient-dashboard-client";

export const metadata: Metadata = {
  title: "Patient Portal — NeuroCare Platform",
  description: "Patient workspace: submit ADHD intake, update care information, request appointments and message your care team.",
  openGraph: {
    title: "Patient Portal — NeuroCare Platform",
    description: "Patient workspace: submit ADHD intake, update care information, request appointments and message your care team.",
    type: "website",
  },
};

export default function PatientPage() {
  return <PatientDashboardClient />;
}
