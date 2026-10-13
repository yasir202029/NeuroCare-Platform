import { notFound } from "next/navigation";
import { PlatformShell, portalConfig, type Portal } from "../../components/platform-shell";
export function generateStaticParams() { return Object.keys(portalConfig).map((portal) => ({ portal })); }
export default async function PortalPage({ params }: { params: Promise<{ portal: string }> }) { const { portal } = await params; if (!(portal in portalConfig)) notFound(); return <PlatformShell portal={portal as Portal} />; }
