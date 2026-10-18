import { PlatformShell } from "../../components/platform-shell";
export const metadata = {
  title: "Clinician Portal — NeuroCare Platform",
  description: "Clinical team workspace: publish sessions, confirm bookings, record attendance and reply to assigned patients.",
  openGraph: {
    title: "Clinician Portal — NeuroCare Platform",
    description: "Clinical team workspace: publish sessions, confirm bookings, record attendance and reply to assigned patients.",
    type: "website",
  },
};



export default function ClinicianPage() {
  return <PlatformShell portal="clinician" />;
}
