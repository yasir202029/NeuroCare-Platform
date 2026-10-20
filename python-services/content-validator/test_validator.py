"""Tests for the marketing content validator."""
import unittest

from validator import (
    FORBIDDEN_SCHEMA_TYPES,
    ValidationReport,
    render_json,
    validate_json_ld,
    validate_pages,
)


def page(**overrides):
    base = {
        "path": "/example",
        "title": "A perfectly reasonable page title for testing",
        "description": "A description that is comfortably long enough to satisfy the minimum length rule for the validator.",
    }
    base.update(overrides)
    return base


class ValidatePagesTest(unittest.TestCase):
    def test_accepts_a_single_valid_page(self):
        report = validate_pages([page()], ["/example"])
        self.assertTrue(report.ok, [i.as_dict() for i in report.issues])

    def test_flags_duplicate_titles(self):
        report = validate_pages(
            [page(path="/a"), page(path="/b")],
            ["/a", "/b"],
        )
        self.assertFalse(report.ok)
        self.assertTrue(any(i.rule == "duplicate-title" for i in report.issues))

    def test_flags_duplicate_descriptions(self):
        report = validate_pages(
            [page(path="/a"), page(path="/b")],
            ["/a", "/b"],
        )
        self.assertTrue(any(i.rule == "duplicate-description" for i in report.issues))

    def test_flags_unimplemented_routes(self):
        report = validate_pages([page(path="/missing")], ["/other"])
        self.assertFalse(report.ok)
        self.assertTrue(any(i.rule == "unimplemented-route" for i in report.issues))

    def test_flags_duplicate_faq_questions(self):
        faq = [
            {"question": "Same question?", "answer": "First answer."},
            {"question": "Same question?", "answer": "Second answer."},
        ]
        report = validate_pages([page(faq=faq)], ["/example"])
        self.assertFalse(report.ok)
        self.assertTrue(any(i.rule == "duplicate-faq" for i in report.issues))

    def test_flags_empty_faq_entries(self):
        report = validate_pages([page(faq=[{"question": "Q?", "answer": ""}])], ["/example"])
        self.assertFalse(report.ok)
        self.assertTrue(any(i.rule == "empty-faq" for i in report.issues))

    def test_flags_unsupported_claims(self):
        report = validate_pages(
            [page(title="Award-winning ADHD clinic with a 95% success rate")],
            ["/example"],
        )
        self.assertFalse(report.ok)
        self.assertTrue(any(i.rule == "unsupported-claim" for i in report.issues))

    def test_warns_on_short_descriptions(self):
        report = validate_pages([page(description="Too short.")], ["/example"])
        self.assertTrue(any(i.severity == "warning" and i.rule == "description-length" for i in report.issues))


class ValidateJsonLdTest(unittest.TestCase):
    def test_accepts_supported_types(self):
        graph = [{"@type": "Organization", "@id": "x"}, {"@type": "FAQPage", "@id": "y"}]
        self.assertEqual(validate_json_ld(graph), [])

    def test_flags_forbidden_types(self):
        for forbidden in FORBIDDEN_SCHEMA_TYPES:
            issues = validate_json_ld([{"@type": forbidden, "@id": "x"}])
            self.assertTrue(issues, forbidden)
            self.assertEqual(issues[0].rule, "forbidden-schema-type")

    def test_render_json_is_deterministic(self):
        graph = [{"@type": "WebSite", "name": "x", "url": "y"}]
        self.assertEqual(render_json(graph), render_json(graph))


if __name__ == "__main__":
    unittest.main()
