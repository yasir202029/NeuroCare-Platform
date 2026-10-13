import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "NeuroCare Platform", description: "Connected patient and clinical operations", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
