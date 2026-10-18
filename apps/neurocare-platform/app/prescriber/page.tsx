import { PlatformShell } from "../../components/platform-shell";
export const metadata = {
  title: "Prescriber Portal — NeuroCare Platform",
  description: "Medication release workspace: review assigned prescriptions, verify medication and sign authorised orders.",
  openGraph: {
    title: "Prescriber Portal — NeuroCare Platform",
    description: "Medication release workspace: review assigned prescriptions, verify medication and sign authorised orders.",
    type: "website",
  },
};



export default function PrescriberPage() {
  return <PlatformShell portal="prescriber" />;
}
