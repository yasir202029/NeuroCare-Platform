import { EngineConsole } from "../../components/engine-console";
export const metadata = {
  title: "Workflow Engine — NeuroCare Platform",
  description: "Platform operations: inspect workflow states, rules, tasks and audited transitions.",
  openGraph: {
    title: "Workflow Engine — NeuroCare Platform",
    description: "Platform operations: inspect workflow states, rules, tasks and audited transitions.",
    type: "website",
  },
};


export default function Page() { return <EngineConsole view="engine" />; }
