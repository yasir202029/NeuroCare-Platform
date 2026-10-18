import { EngineConsole } from "../../components/engine-console";
export const metadata = {
  title: "Workflow Rules — NeuroCare Platform",
  description: "Inspect clinical workflow rules for the care pathway engine.",
  openGraph: {
    title: "Workflow Rules — NeuroCare Platform",
    description: "Inspect clinical workflow rules for the care pathway engine.",
    type: "website",
  },
};


export default function Page() { return <EngineConsole view="rules" />; }
