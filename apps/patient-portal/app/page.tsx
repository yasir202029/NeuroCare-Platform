"use client";
import { useState } from "react";

const nav = ["Dashboard", "Patients", "Appointments", "Messages", "Documents", "Reports", "Prescriptions", "Settings"] as const;
const cards = [
  ["Appointments", "Next appointment", "Awaiting confirmation", "Your care team will share the date and joining details here."],
  ["Tasks", "Nothing needs action", "All caught up", "Questionnaires, consent and uploads appear with clear due dates."],
  ["Documents", "Care documents", "Securely shared", "Reports, letters and requested uploads remain in one protected place."],
  ["Messages", "Care team messages", "No unread messages", "Start a secure conversation when your clinic enables messaging."],
  ["Physical health", "Health checks", "Not requested", "Record blood pressure, pulse and weight only when requested by your team."],
  ["Prescriptions", "Medication tracker", "No active prescription", "Prescription status, collection and delivery updates will appear here."],
  ["Invoices", "Billing centre", "No invoices due", "View statements, payment status and receipts without leaving your care space."],
  ["Feedback", "Share feedback", "Always open", "Tell us how your experience is going. Your response reaches the service team."],
] as const;
const journey = ["Referral received", "Questionnaires", "Assessment", "Clinical review", "Your report"];
export default function Page() {
  const [active, setActive] = useState<(typeof nav)[number]>("Dashboard"); const [dark, setDark] = useState(false);
  return <main className={`portal ${dark ? "dark" : ""}`}>
    <aside className="sidebar"><div className="brand"><span>n</span><div><b>NeuroAssess</b><small>Patient care</small></div></div><nav>{nav.map(item=><button key={item} className={active===item?"active":""} onClick={()=>setActive(item)}>{item}</button>)}</nav><div className="side-foot"><button onClick={()=>setDark(!dark)}>{dark ? "Light appearance" : "Dark appearance"}</button><small>Secure, consent-led care</small></div></aside>
    <section className="content"><header><div><p className="eyebrow">Thursday, 17 September</p><h1>Good afternoon, Yasir.</h1><p className="muted">Your private care space, designed around what matters next.</p></div><div className="profile">YA</div></header>
    {active === "Dashboard" ? <><section className="hero"><div><p className="eyebrow">Care journey</p><h2>Moving at your pace.</h2><p>Your care team keeps this pathway up to date. You are currently waiting for the next clinical update.</p></div><div className="hero-status"><span>2 of 5</span><small>steps complete</small></div></section>
    <section className="journey">{journey.map((item,index)=><div className={index<2?"done":""} key={item}><i>{index<2 ? "✓" : index+1}</i><strong>{item}</strong>{index===1&&<small>In progress</small>}</div>)}</section>
    <section className="section-head"><div><p className="eyebrow">Your care overview</p><h2>Everything in one calm place</h2></div></section><section className="cards">{cards.map(([label,title,status,copy])=><article className="card" key={label}><p className="eyebrow">{label}</p><span className="badge">{status}</span><h3>{title}</h3><p className="muted">{copy}</p></article>)}</section>
    <section className="timeline"><div><p className="eyebrow">Timeline of care</p><h2>Recent updates</h2></div><div className="empty">Your timeline will show securely shared appointments, reports and treatment updates.</div></section></> : <section className="workspace"><p className="eyebrow">{active}</p><h2>{active} centre</h2><p className="muted">This connected workspace will show only information securely shared with you by your clinic.</p><div className="empty">There is nothing new to show here yet.</div></section>}
    <footer>Need urgent help? Contact your local emergency service. This portal is not monitored for emergencies.</footer></section>
  </main>;
}
