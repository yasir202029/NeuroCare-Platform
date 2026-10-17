import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
	title: "NeuroCare | Remote ADHD assessment and ongoing care",
	description:
		"Clinician-led ADHD assessment, medication reviews, prescribing and follow-up through remote appointments and a private patient portal.",
};

export default function Layout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
