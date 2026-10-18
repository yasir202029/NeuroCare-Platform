import { EngineConsole } from "../../components/engine-console";
export const metadata = {
  title: "Workflow Events — NeuroCare Platform",
  description: "Inspect audited workflow events for the care pathway engine.",
  openGraph: {
    title: "Workflow Events — NeuroCare Platform",
    description: "Inspect audited workflow events for the care pathway engine.",
    type: "website",
  },
};


export default function Page() { return <EngineConsole view="events" />; }
