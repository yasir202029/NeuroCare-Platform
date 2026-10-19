from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="NeuroCare Report Engine", version="1.0.0")

class ReportRequest(BaseModel):
    patientId: str
    type: str  # assessment, titration, discharge, shared-care
    data: dict = {}

@app.get("/health")
def health():
    return {"status": "ok", "service": "report-engine", "timestamp": datetime.utcnow().isoformat()}

@app.post("/generate")
def generate(req: ReportRequest):
    return {
        "reportId": f"rep_{req.patientId}_{req.type}",
        "patientId": req.patientId,
        "type": req.type,
        "generatedAt": datetime.utcnow().isoformat(),
        "format": "pdf",
        "status": "ready",
        "sections": ["summary", "clinical", "recommendations", "audit"],
    }

@app.get("/templates")
def templates():
    return {"templates": ["assessment", "titration", "discharge", "shared-care", "invoice"]}
