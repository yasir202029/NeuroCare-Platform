import { PlatformShell } from "../../components/platform-shell";
export const metadata = {
  title: "Titration Portal — NeuroCare Platform",
  description: "Medication safety workspace: review ADHD dose response, side effects and follow-up for assigned cases.",
  openGraph: {
    title: "Titration Portal — NeuroCare Platform",
    description: "Medication safety workspace: review ADHD dose response, side effects and follow-up for assigned cases.",
    type: "website",
  },
};



export default function TitrationPage() {
  return <PlatformShell portal="titration" />;
}
