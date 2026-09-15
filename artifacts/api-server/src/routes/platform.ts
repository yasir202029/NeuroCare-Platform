import { Router, type IRouter } from "express";
import {
  CreateAppointmentBody,
  CreateAppointmentResponse,
  CreateAssessmentBody,
  CreateAssessmentResponse,
  CreateMessageBody,
  CreateMessageResponse,
  GetPlatformSummaryResponse,
  ListAppointmentsResponse,
  ListAssessmentsResponse,
  ListDocumentsResponse,
  ListMessagesResponse,
  ListPatientsResponse,
  ListPaymentsResponse,
  ListReportsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type Appointment = {
  id: string;
  patientName: string;
  patientId: string;
  clinicianName: string;
  type: string;
  date: string;
  time: string;
  status: string;
  location: string;
};

const appointments: Appointment[] = [
  {
    id: "apt-001",
    patientName: "Maya Thompson",
    patientId: "pat-001",
    clinicianName: "Dr. Emily Carter",
    type: "ADHD assessment",
    date: "2026-09-22",
    time: "10:30",
    status: "Confirmed",
    location: "Video consultation",
  },
  {
    id: "apt-002",
    patientName: "Oliver Hughes",
    patientId: "pat-002",
    clinicianName: "Dr. James Wilson",
    type: "Autism assessment",
    date: "2026-09-24",
    time: "14:00",
    status: "Awaiting forms",
    location: "Video consultation",
  },
  {
    id: "apt-003",
    patientName: "Sophie Khan",
    patientId: "pat-003",
    clinicianName: "Dr. Emily Carter",
    type: "Follow-up appointment",
    date: "2026-09-25",
    time: "09:00",
    status: "Confirmed",
    location: "Video consultation",
  },
];

const patients = [
  {
    id: "pat-001",
    name: "Maya Thompson",
    email: "maya.thompson@example.com",
    initials: "MT",
    assessment: "ADHD",
    status: "In progress",
    progress: 68,
    lastActive: "Today, 09:14",
  },
  {
    id: "pat-002",
    name: "Oliver Hughes",
    email: "oliver.hughes@example.com",
    initials: "OH",
    assessment: "Autism",
    status: "Awaiting forms",
    progress: 32,
    lastActive: "Yesterday",
  },
  {
    id: "pat-003",
    name: "Sophie Khan",
    email: "sophie.khan@example.com",
    initials: "SK",
    assessment: "ADHD",
    status: "Report ready",
    progress: 100,
    lastActive: "12 Sep 2026",
  },
];

const assessments = [
  {
    id: "asm-001",
    patientName: "Maya Thompson",
    type: "ADHD",
    stage: "Clinical interview",
    progress: 68,
    updatedAt: "Today, 09:14",
    clinicianName: "Dr. Emily Carter",
  },
  {
    id: "asm-002",
    patientName: "Oliver Hughes",
    type: "Autism",
    stage: "Questionnaires",
    progress: 32,
    updatedAt: "Yesterday",
    clinicianName: "Dr. James Wilson",
  },
  {
    id: "asm-003",
    patientName: "Sophie Khan",
    type: "ADHD",
    stage: "Complete",
    progress: 100,
    updatedAt: "12 Sep 2026",
    clinicianName: "Dr. Emily Carter",
  },
];

const reports = [
  {
    id: "rpt-001",
    title: "ADHD assessment report",
    type: "ADHD",
    date: "12 Sep 2026",
    status: "Available",
    clinicianName: "Dr. Emily Carter",
    size: "2.4 MB",
  },
  {
    id: "rpt-002",
    title: "Clinical summary",
    type: "Autism",
    date: "06 Sep 2026",
    status: "Available",
    clinicianName: "Dr. James Wilson",
    size: "1.8 MB",
  },
];

const messages = [
  {
    id: "msg-001",
    sender: "Dr. Emily Carter",
    subject: "Your assessment forms",
    preview: "Thank you for completing the first set of forms. I have reviewed...",
    time: "Today, 09:14",
    unread: true,
    direction: "received",
  },
  {
    id: "msg-002",
    sender: "NeuroAssess UK",
    subject: "Your report is ready",
    preview: "Your ADHD assessment report is now available in your portal.",
    time: "12 Sep 2026",
    unread: false,
    direction: "received",
  },
  {
    id: "msg-003",
    sender: "You",
    subject: "Question about my appointment",
    preview: "Hi Emily, I wanted to check whether our appointment...",
    time: "10 Sep 2026",
    unread: false,
    direction: "sent",
  },
];

const documents = [
  {
    id: "doc-001",
    name: "ADHD assessment report.pdf",
    category: "Reports",
    date: "12 Sep 2026",
    size: "2.4 MB",
    status: "Ready",
  },
  {
    id: "doc-002",
    name: "School feedback form.pdf",
    category: "Questionnaires",
    date: "06 Sep 2026",
    size: "640 KB",
    status: "Reviewed",
  },
];

const payments = [
  {
    id: "pay-001",
    description: "ADHD assessment",
    date: "01 Sep 2026",
    amount: 695,
    status: "Paid",
    invoice: "INV-1048",
  },
  {
    id: "pay-002",
    description: "Follow-up appointment",
    date: "15 Aug 2026",
    amount: 95,
    status: "Paid",
    invoice: "INV-1016",
  },
];

router.get("/platform/summary", (_req, res) => {
  res.json(
    GetPlatformSummaryResponse.parse({
      activePatients: 128,
      pendingAssessments: 24,
      upcomingAppointments: 9,
      outstandingBalance: 695,
      unreadMessages: 3,
    }),
  );
});

router.get("/appointments", (_req, res) => {
  res.json(ListAppointmentsResponse.parse(appointments));
});

router.post("/appointments", (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const appointment = {
    id: `apt-${String(appointments.length + 1).padStart(3, "0")}`,
    patientName: "New patient",
    patientId: "pat-new",
    clinicianName: "NeuroAssess clinical team",
    status: "Payment pending",
    ...parsed.data,
  };
  appointments.push(appointment);
  res.status(201).json(CreateAppointmentResponse.parse(appointment));
});

router.get("/patients", (_req, res) => {
  res.json(ListPatientsResponse.parse(patients));
});

router.get("/assessments", (_req, res) => {
  res.json(ListAssessmentsResponse.parse(assessments));
});

router.post("/assessments", (req, res) => {
  const parsed = CreateAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const assessment = {
    id: `asm-${String(assessments.length + 1).padStart(3, "0")}`,
    patientName: "New patient",
    stage: "Not started",
    progress: 0,
    updatedAt: "Just now",
    clinicianName: "To be assigned",
    type: parsed.data.type,
  };
  assessments.push(assessment);
  res.status(201).json(CreateAssessmentResponse.parse(assessment));
});

router.get("/reports", (_req, res) => {
  res.json(ListReportsResponse.parse(reports));
});

router.get("/messages", (_req, res) => {
  res.json(ListMessagesResponse.parse(messages));
});

router.post("/messages", (req, res) => {
  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const message = {
    id: `msg-${String(messages.length + 1).padStart(3, "0")}`,
    sender: "You",
    preview: parsed.data.body,
    time: "Just now",
    unread: false,
    direction: "sent",
    subject: parsed.data.subject,
  };
  messages.unshift(message);
  res.status(201).json(CreateMessageResponse.parse(message));
});

router.get("/documents", (_req, res) => {
  res.json(ListDocumentsResponse.parse(documents));
});

router.get("/payments", (_req, res) => {
  res.json(ListPaymentsResponse.parse(payments));
});

export default router;