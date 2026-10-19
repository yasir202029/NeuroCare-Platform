from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
    return {"status": "ok", "service": "clinical-ai", "timestamp": datetime.utcnow().isoformat()}

@app.post("/draft-report")
def draft_report(req: ReportRequest):
    return {
        "reportId": f"rpt_{req.patientId}",
        "patientId": req.patientId,
        "clinicianId": req.clinicianId,
        "draft": "Clinical summary drafted by AI. Requires clinician review and signature.",
        "sections": req.sections,
        "status": "draft",
        "generatedAt": datetime.utcnow().isoformat(),
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
        "generatedAt": datetime.utcnow().isoformat(),
    }

@app.get("/pathway/{patientId}")
def pathway(patientId: str):
    return {
        "patientId": patientId,
        "stages": ["referral", "assessment", "diagnosis", "titration", "prescribing", "shared-care", "discharge"],
        "current": "assessment",
        "nextActions": ["complete assessment", "risk stratification", "plan titration"],
    }
