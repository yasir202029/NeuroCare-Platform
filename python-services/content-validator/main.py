from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timezone

from validator import Issue, ValidationReport, render_json, validate_json_ld, validate_pages

app = FastAPI(title="NeuroCare Content Validator", version="1.0.0")

FORBIDDEN_SCHEMA_TYPES = [
    "AggregateRating",
    "Review",
    "LocalBusiness",
    "MedicalClinic",
    "Person",
    "Offer",
]


class PageInput(BaseModel):
    path: str
    title: str
    description: str
    faq: list[dict[str, str]] = []


class ValidationRequest(BaseModel):
    pages: list[PageInput]
    knownRoutes: list[str] = []
    jsonLd: list[dict] = []


@app.get("/health")
def health():
    return {"status": "ok", "service": "content-validator", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/rules")
def rules():
    return {
        "forbiddenSchemaTypes": FORBIDDEN_SCHEMA_TYPES,
        "titleRange": [20, 70],
        "descriptionRange": [70, 180],
    }


@app.post("/validate")
def validate(request: ValidationRequest):
    pages = [page.model_dump() for page in request.pages]
    report: ValidationReport = validate_pages(pages, request.knownRoutes)
    for issue in validate_json_ld(request.jsonLd):
        report.issues.append(issue)
    return report.as_dict()


@app.post("/render-json-ld")
def render_json_ld(request: ValidationRequest):
    return {"json": render_json(request.jsonLd)}
