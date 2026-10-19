from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

app = FastAPI(title="NeuroCare Clinical AI", version="1.0.0")

class ClinicalNote(BaseModel):
    patientId: str
    clinicianId: str
    note: str
    type: str = "progress"

class PrescriptionRequest(BaseModel):
    patientId: str
    clinicianId: str
    medication: str
    dose: str
    isControlledDrug: bool = False
    indication: str = ""

class ReportRequest(BaseModel):
    patientId: str
    clinicianId: str
    sections: List[str] = ["summary", "clinical", "recommendations"]
    format: str = "pdf"

@app.get("/health")
def health():
    return {"status": "ok", "service": "clinical-ai", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/draft-report")
def draft_report(req: ReportRequest):
    return {
        "reportId": f"rpt_{req.patientId}",
        "patientId": req.patientId,
        "clinicianId": req.clinicianId,
        "draft": "Clinical summary drafted by AI. Requires clinician review and signature.",
        "sections": req.sections,
        "status": "draft",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

@app.post("/validate-prescription")
def validate_prescription(req: PrescriptionRequest):
    warnings = []
    if req.isControlledDrug:
        warnings.append("Controlled drug: verify CD register entry and prescriber authority.")
    if not req.indication:
        warnings.append("Indication missing.")
    return {
        "valid": len(warnings) == 0,
        "warnings": warnings,
        "medication": req.medication,
        "dose": req.dose,
        "cd": req.isControlledDrug,
    }

@app.post("/summarise-note")
def summarise_note(note: ClinicalNote):
    return {
        "patientId": note.patientId,
        "summary": f"AI summary of {note.type} note: {note.note[:120]}...",
        "keyPoints": ["Symptom review", "Risk assessment", "Plan update"],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/pathway/{patientId}")
def pathway(patientId: str):
    return {
        "patientId": patientId,
        "stages": ["referral", "assessment", "diagnosis", "titration", "prescribing", "shared-care", "discharge"],
        "current": "assessment",
        "nextActions": ["complete assessment", "risk stratification", "plan titration"],
    }


# ---------- Portal-specific dynamic features ----------

class PatientIntake(BaseModel):
    patientId: str
    demographics: dict = {}
    consentGiven: bool = False

@app.post("/portal/patient/intake")
def patient_intake(req: PatientIntake):
    return {
        "patientId": req.patientId,
        "status": "intake_complete" if req.consentGiven else "consent_required",
        "nextActions": ["complete assessment", "upload documents"] if req.consentGiven else ["record consent"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/portal/patient/{patientId}/journey")
def patient_journey(patientId: str):
    return {
        "patientId": patientId,
        "stages": ["referral", "assessment", "diagnosis", "titration", "prescribing", "shared-care", "discharge"],
        "current": "assessment",
        "nextActions": ["complete assessment", "risk stratification"],
        "progress": 0.28,
    }

class ClinicianAction(BaseModel):
    clinicianId: str
    patientId: str
    action: str  # assess, titrate, prescribe, report, followup
    payload: dict = {}

@app.post("/portal/clinician/action")
def clinician_action(req: ClinicianAction):
    return {
        "clinicianId": req.clinicianId,
        "patientId": req.patientId,
        "action": req.action,
        "status": "completed",
        "nextActions": ["follow-up", "schedule review"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/portal/admin/overview")
def admin_overview():
    return {
        "users": 0,
        "patients": 0,
        "activeClinicians": 0,
        "pendingReports": 0,
        "openTasks": 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/portal/finance/summary")
def finance_summary():
    return {
        "totalInvoiced": 0,
        "totalPaid": 0,
        "outstanding": 0,
        "clinicianEarnings": 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
