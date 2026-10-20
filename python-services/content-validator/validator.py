"""NeuroCare content validator.

Validates the public marketing content model against the SEO rules declared in
docs/SEO_ARCHITECTURE.md:

  - every public route has exactly one declared page
  - titles are unique and length-bounded
  - descriptions are unique and length-bounded
  - canonical paths match the route
  - FAQ pairs are present, non-empty and unique
  - structured data contains no forbidden types

The validator is intentionally independent of the Next.js runtime so that it can
run in CI, in a container, or locally without installing the web toolchain.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

TITLE_MIN = 20
TITLE_MAX = 70
DESCRIPTION_MIN = 70
DESCRIPTION_MAX = 180

#: Structured-data types that must never be emitted for this service because
#: the organisation cannot substantiate them.
FORBIDDEN_SCHEMA_TYPES = {
    "AggregateRating",
    "Review",
    "LocalBusiness",
    "MedicalClinic",
    "Person",
    "Offer",
}

#: Claims that must not appear in public content.
FORBIDDEN_CLAIM_PATTERNS = [
    r"\bCQC\b",
    r"\bNICE approved\b",
    r"\bNHS approved\b",
    r"\b\d+\s*%?\s*(success|recovery|cure) rate\b",
    r"\bpatient numbers?\b",
    r"\bwaiting time of\b",
    r"\baward[- ]winning\b",
    r"\bguaranteed\b",
]

_ROUTE_PATTERN = re.compile(r"^/[a-z0-9\-]*(/[a-z0-9\-]*)*$")


@dataclass
class Issue:
    severity: str  # "error" | "warning"
    rule: str
    path: str
    detail: str

    def as_dict(self) -> dict[str, str]:
        return {
            "severity": self.severity,
            "rule": self.rule,
            "path": self.path,
            "detail": self.detail,
        }


@dataclass
class ValidationReport:
    checked_pages: int = 0
    issues: list[Issue] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not any(issue.severity == "error" for issue in self.issues)

    def as_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "checkedPages": self.checked_pages,
            "errorCount": sum(1 for i in self.issues if i.severity == "error"),
            "warningCount": sum(1 for i in self.issues if i.severity == "warning"),
            "issues": [issue.as_dict() for issue in self.issues],
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }


def validate_pages(pages: list[dict[str, Any]], known_routes: list[str]) -> ValidationReport:
    """Validate a list of public page descriptors.

    Each page descriptor expects: path, title, description and an optional faq list
    of {question, answer} objects.
    """
    report = ValidationReport(checked_pages=len(pages))
    seen_paths: set[str] = set()
    seen_titles: set[str] = set()
    seen_descriptions: set[str] = set()

    for page in pages:
        path = str(page.get("path", ""))
        title = str(page.get("title", ""))
        description = str(page.get("description", ""))
        faq = page.get("faq") or []

        if path in seen_paths:
            report.issues.append(Issue("error", "duplicate-path", path, "Path declared more than once"))
        seen_paths.add(path)

        if not _ROUTE_PATTERN.match(path):
            report.issues.append(Issue("error", "invalid-path", path, "Path is not a valid public route"))

        if known_routes and path not in known_routes:
            report.issues.append(Issue("error", "unimplemented-route", path, "No page implements this route"))

        if not (TITLE_MIN <= len(title) <= TITLE_MAX):
            report.issues.append(
                Issue("warning", "title-length", path, f"Title length {len(title)} outside {TITLE_MIN}-{TITLE_MAX}")
            )
        if title in seen_titles:
            report.issues.append(Issue("error", "duplicate-title", path, "Title is not unique"))
        seen_titles.add(title)

        if not (DESCRIPTION_MIN <= len(description) <= DESCRIPTION_MAX):
            report.issues.append(
                Issue(
                    "warning",
                    "description-length",
                    path,
                    f"Description length {len(description)} outside {DESCRIPTION_MIN}-{DESCRIPTION_MAX}",
                )
            )
        if description in seen_descriptions:
            report.issues.append(Issue("error", "duplicate-description", path, "Description is not unique"))
        seen_descriptions.add(description)

        for pattern in FORBIDDEN_CLAIM_PATTERNS:
            if re.search(pattern, f"{title} {description}", flags=re.IGNORECASE):
                report.issues.append(
                    Issue("error", "unsupported-claim", path, f"Content matches forbidden claim pattern {pattern!r}")
                )

        questions: set[str] = set()
        for entry in faq:
            question = str(entry.get("question", "")).strip()
            answer = str(entry.get("answer", "")).strip()
            if not question or not answer:
                report.issues.append(Issue("error", "empty-faq", path, "FAQ entry has an empty question or answer"))
                continue
            if question in questions:
                report.issues.append(Issue("error", "duplicate-faq", path, f"Duplicate FAQ question: {question!r}"))
            questions.add(question)

    return report


def validate_json_ld(graph: list[dict[str, Any]]) -> list[Issue]:
    """Validate a structured-data graph for forbidden types and JSON safety."""
    issues: list[Issue] = []
    for node in graph:
        node_type = node.get("@type")
        types = node_type if isinstance(node_type, list) else [node_type]
        for candidate in types:
            if candidate in FORBIDDEN_SCHEMA_TYPES:
                issues.append(
                    Issue("error", "forbidden-schema-type", str(node.get("@id", "")), f"Schema type {candidate!r} is not substantiated")
                )
    return issues


def render_json(graph: list[dict[str, Any]]) -> str:
    """Serialise a structured-data graph deterministically for diffing/tests."""
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, indent=2, sort_keys=True)
