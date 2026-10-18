import { EngineConsole } from "../../components/engine-console";
export const metadata = {
  title: "Workflow States — NeuroCare Platform",
  description: "Inspect workflow states for the care pathway engine.",
  openGraph: {
    title: "Workflow States — NeuroCare Platform",
    description: "Inspect workflow states for the care pathway engine.",
    type: "website",
  },
};


export default function Page() { return <EngineConsole view="states" />; }
