import type { Metadata } from "next";
import "../../../packages/ui/portal.css";
export const metadata: Metadata = { title: "NeuroAssess", robots: { index: false, follow: false } };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
