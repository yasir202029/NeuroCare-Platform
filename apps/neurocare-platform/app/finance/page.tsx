import { PlatformShell } from "../../components/platform-shell";
export const metadata = {
  title: "Finance Portal — NeuroCare Platform",
  description: "Revenue operations: monitor service activity, invoices, payments and outstanding balances.",
  openGraph: {
    title: "Finance Portal — NeuroCare Platform",
    description: "Revenue operations: monitor service activity, invoices, payments and outstanding balances.",
    type: "website",
  },
};



export default function FinancePage() {
  return <PlatformShell portal="finance" />;
}
