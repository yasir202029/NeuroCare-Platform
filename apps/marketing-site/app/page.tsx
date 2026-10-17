import Link from "next/link";

const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";

const services = [
	{
		number: "01",
		title: "ADHD assessment",
		description:
			"A clinician-led assessment pathway that brings together your history, screening information and a remote consultation before care recommendations are made.",
		details: "Intake · Clinical review · Written outcome",
	},
	{
		number: "02",
		title: "Medication titration",
		description:
			"Structured follow-up to review how medication is working, discuss side effects and plan appropriate physical-health checks with your clinician.",
		details: "Dose reviews · Response tracking · Safety checks",
	},
	{
		number: "03",
		title: "Prescribing and shared care",
		description:
			"Prescriber review, prescription decisions and coordinated handover when shared care with your GP is clinically appropriate.",
		details: "Authorised review · Prescription · Care handover",
	},
	{
		number: "04",
		title: "Ongoing support",
		description:
			"Keep appointments, messages and care information connected in one private patient portal throughout your pathway.",
		details: "Remote appointments · Secure messages · Follow-up",
	},
];

const steps = [
	["01", "Tell us about your needs", "Share intake information and accessibility preferences securely."],
	["02", "Meet your clinical team", "Request an appointment and speak with your clinician remotely."],
	["03", "Agree the next step", "Review your outcome and decide together whether further care is appropriate."],
	["04", "Stay connected", "Use your portal for follow-up, medication reviews and messages."],
];

export default function Page() {
	return (
		<main className="site-page" id="top">
			<header className="site-header">
				<Link href="#top" className="site-brand" aria-label="NeuroCare home">
					<span className="brand-mark">n</span>
					<span>NeuroCare</span>
				</Link>
				<nav className="site-nav" aria-label="Main navigation">
					<a href="#services">Services</a>
					<a href="#care-process">Care process</a>
					<a href="#remote-care">Remote care</a>
				</nav>
				<a className="site-sign-in" href={`${portalUrl}/login?next=%2Fpatient`}>
					Patient sign in <span aria-hidden="true">↗</span>
				</a>
			</header>

			<section className="service-hero" aria-labelledby="hero-title">
				<div className="hero-photo" role="img" aria-label="Clinician reviewing care information during a remote consultation" />
				<div className="hero-shade" />
				<div className="hero-content">
					<p className="eyebrow hero-eyebrow">Remote ADHD clinic · Assessment and ongoing care</p>
					<h1 id="hero-title">ADHD care, with a clear next step.</h1>
					<p className="hero-description">
						Specialist-led assessment, medication reviews and follow-up, connected through secure remote appointments and a private patient portal.
					</p>
					<div className="hero-actions">
						<a className="button button-light" href={`${portalUrl}/login?next=%2Fpatient`}>
							Start your care request <span aria-hidden="true">→</span>
						</a>
						<a className="hero-text-link" href="#services">Explore our services</a>
					</div>
					<p className="hero-note">Care plans and prescribing decisions are made by your clinical team.</p>
				</div>
				<div className="hero-caption"><span>01 / 04</span><span>Assessment through follow-up</span></div>
			</section>

			<section className="service-section" id="services" aria-labelledby="services-title">
				<div className="section-intro">
					<p className="eyebrow">Services</p>
					<h2 id="services-title">One connected ADHD care pathway</h2>
					<p>Access the right support as your needs change, with your information and care team kept in sync.</p>
				</div>
				<div className="service-list">
					{services.map((service) => (
						<article className="service-row" key={service.number}>
							<span className="service-number">{service.number}</span>
							<div className="service-copy">
								<h3>{service.title}</h3>
								<p>{service.description}</p>
								<small>{service.details}</small>
							</div>
							<a href={`${portalUrl}/login?next=%2Fpatient`} aria-label={`Start ${service.title}`} className="service-arrow">↗</a>
						</article>
					))}
				</div>
			</section>

			<section className="care-section" id="care-process" aria-labelledby="care-title">
				<div className="care-heading">
					<p className="eyebrow">How care works</p>
					<h2 id="care-title">From first request to follow-up</h2>
				</div>
				<div className="care-steps">
					{steps.map(([number, title, description]) => (
						<article className="care-step" key={number}>
							<span>{number}</span>
							<h3>{title}</h3>
							<p>{description}</p>
						</article>
					))}
				</div>
			</section>

			<section className="remote-section" id="remote-care" aria-labelledby="remote-title">
				<div>
					<p className="eyebrow">Remote care</p>
					<h2 id="remote-title">Your appointments and care information, together.</h2>
				</div>
				<div className="remote-copy">
					<p>Request available sessions, share information with your clinician and keep conversations in your secure patient portal.</p>
					<a className="button button-green" href={`${portalUrl}/login?next=%2Fpatient`}>
						Open patient portal <span aria-hidden="true">→</span>
					</a>
				</div>
			</section>

			<footer className="site-footer">
				<Link href="#top" className="site-brand"><span className="brand-mark">n</span><span>NeuroCare</span></Link>
				<p>Remote ADHD assessment and ongoing clinical care.</p>
				<small>This service is not for emergencies. If you need urgent help, contact your local emergency service.</small>
			</footer>
		</main>
	);
}
