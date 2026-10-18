import { PlatformShell } from "../../components/platform-shell";
export const metadata = {
  title: "Patient Portal — NeuroCare Platform",
  description: "Patient workspace: submit ADHD intake, update care information, request appointments and message your care team.",
  openGraph: {
    title: "Patient Portal — NeuroCare Platform",
    description: "Patient workspace: submit ADHD intake, update care information, request appointments and message your care team.",
    type: "website",
  },
};



export default function PatientPage() {
  return <PlatformShell portal="patient" />;
}
