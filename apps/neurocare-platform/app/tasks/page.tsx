import { EngineConsole } from "../../components/engine-console";
export const metadata = {
  title: "Clinical Tasks — NeuroCare Platform",
  description: "Manage clinical task queues for the care pathway engine.",
  openGraph: {
    title: "Clinical Tasks — NeuroCare Platform",
    description: "Manage clinical task queues for the care pathway engine.",
    type: "website",
  },
};


export default function Page() { return <EngineConsole view="tasks" />; }
