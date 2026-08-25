import json
import tempfile
import unittest
from pathlib import Path

from soliddesign.audit.adapter import audit_result_from_dict
from soliddesign.brief import build_conversion_brief
from soliddesign.demo.openpage import build_site_config, render_static_html
from soliddesign.design import derive_design_profile
from soliddesign.models import (
    AuditFinding,
    AuditResult,
    ConversionBrief,
    FactorScore,
    Prospect,
    QualificationInput,
    VerifiedFacts,
)
from soliddesign.pipeline import run_golden_fixture
from soliddesign.print_pack.renderer import render_print_pack
from soliddesign.qualification import qualify
from soliddesign.security import UnsafeUrlError, validate_public_http_url


class QualificationTests(unittest.TestCase):
    def _input(self, gate=True):
        f = lambda name, score: FactorScore(name=name, score=score, evidence=("evidence",))
        return QualificationInput(
            customer_economics=f("customer_economics", 4),
            existing_demand=f("existing_demand", 4),
            conversion_opportunity=f("conversion_opportunity", 4),
            execution_fit=f("execution_fit", 5),
            competitive_context=f("competitive_context", 3),
            hard_gates={"existing_website": gate},
        )

    def test_score_and_gate(self):
        self.assertTrue(qualify(self._input()).eligible)
        self.assertEqual(qualify(self._input()).total_score, 20)
        self.assertFalse(qualify(self._input(False)).eligible)


class SecurityTests(unittest.TestCase):
    def test_blocks_loopback_and_metadata(self):
        for url in ("http://127.0.0.1/admin", "http://169.254.169.254/latest/meta-data"):
            with self.assertRaises(UnsafeUrlError):
                validate_public_http_url(url, resolve_dns=False)

    def test_allows_public_literal_ip(self):
        self.assertEqual(validate_public_http_url("https://8.8.8.8/", resolve_dns=False), "https://8.8.8.8/")


class AuditContractTests(unittest.TestCase):
    def test_normalized_contract_round_trip(self):
        raw = {"url": "https://example.com", "score": 70, "grade": "C", "source": "pitch-doctor", "findings": [{"key": "contact_friction", "severity": "warning", "title": "Contact friction", "evidence": ["Phone CTA is hard to find"], "business_impact": "Visitors may abandon.", "verified": True}]}
        result = audit_result_from_dict(raw)
        self.assertEqual(result.findings[0].key, "contact_friction")


class DemoTests(unittest.TestCase):
    def _facts(self):
        return VerifiedFacts(company_name="Test BV", category="installateur", city="Utrecht", address="Test 1", website_url="https://example.com", phone="0301234567", rating=4.8, review_count=50, services=("Warmtepompinstallatie", "Verwarming", "Duurzame woninginstallaties"), brand_colors=("#155EEF",), approved_claims=(), evidence={})

    def _brief(self):
        return ConversionBrief(headline="Warmtepompinstallatie en verwarming in Utrecht.", subheadline="Ook voor duurzame woninginstallaties. Neem rechtstreeks contact op voor een vraag of project.", primary_cta="Bel direct", primary_cta_url="tel:0301234567", opportunities=("CTA verbeteren",), trust_points=("4.8/5 op basis van 50 Google-beoordelingen",), sections=("hero", "services", "trust"))

    def test_safe_openpage_shape(self):
        facts = self._facts()
        cfg = build_site_config(facts, self._brief())
        block_types = [b["type"] for b in cfg.blocks]
        self.assertNotIn("testimonials", block_types)
        self.assertNotIn("contact", block_types)
        page = render_static_html(cfg, prospect_name=facts.company_name)
        self.assertIn("noindex,nofollow,noarchive", page)
        self.assertNotIn("<form", page.lower())

    def test_design_profile_is_small_and_deterministic(self):
        facts = self._facts()
        profile = derive_design_profile(facts, self._brief())
        self.assertEqual(profile.page_type, "authority_service")
        self.assertEqual(profile.hero_variant, "service_split")
        self.assertEqual(profile.services_variant, "editorial_list")
        self.assertEqual(profile.cta_variant, "light")
        self.assertEqual(profile.motion_level, "low")
        self.assertIn("no_fake_proof", profile.anti_patterns)
        self.assertIn("no_decorative_empty_hero_panel", profile.anti_patterns)

    def test_customer_copy_is_not_database_copy(self):
        facts = self._facts()
        audit = AuditResult(url=facts.website_url, score=40, grade="F", findings=(), source="test")
        brief = build_conversion_brief(facts, audit)
        self.assertEqual(brief.headline, "Warmtepompinstallatie en verwarming in Utrecht.")
        self.assertIn("Ook voor duurzame woninginstallaties", brief.subheadline)
        self.assertNotIn(facts.company_name + ".", brief.headline)
        self.assertNotIn("helder overzicht van de dienstverlening", brief.subheadline.lower())

    def test_premium_renderer_avoids_known_ai_slop_and_overlap_pattern(self):
        facts = self._facts()
        page = render_static_html(build_site_config(facts, self._brief()), prospect_name=facts.company_name).lower()
        self.assertNotIn("linear-gradient", page)
        self.assertNotIn("radial-gradient", page)
        self.assertNotIn("font-family:inter", page)
        self.assertNotIn("box-shadow", page)
        self.assertNotIn("hero-panel", page)
        self.assertIn("service-summary", page)
        self.assertIn("overflow-wrap:break-word", page)
        self.assertIn("hyphens:auto", page)
        self.assertIn("service-list", page)

    def test_no_fake_proof_fillers_when_real_proof_is_absent(self):
        facts = VerifiedFacts(company_name="Test BV", category="installateur", city="Utrecht", address="Test 1", website_url="https://example.com", phone="0301234567", rating=None, review_count=None, services=("Onderhoud",), brand_colors=(), approved_claims=(), evidence={})
        brief = ConversionBrief(headline="Onderhoud in Utrecht.", subheadline="Neem rechtstreeks contact op voor een vraag of project.", primary_cta="Bel direct", primary_cta_url="tel:0301234567", opportunities=(), trust_points=(), sections=("hero", "services", "contact"))
        cfg = build_site_config(facts, brief)
        self.assertNotIn("stats", [b["type"] for b in cfg.blocks])
        page = render_static_html(cfg, prospect_name=facts.company_name)
        self.assertNotIn("vestigingsplaats", page.lower())
        self.assertNotIn("telefonisch contact", page.lower())

    def test_print_pack_shows_verified_unreachable_state_without_fake_screenshot(self):
        prospect = Prospect(
            id="test:1",
            name="Test Installatie",
            category="installateur",
            city="Utrecht",
            address="Teststraat 1",
            website_url="https://example.com",
            phone="0301234567",
            observed_services=("Onderhoud",),
        )
        audit = AuditResult(
            url=prospect.website_url,
            score=0,
            grade="F",
            findings=(
                AuditFinding(
                    key="reachability",
                    severity="critical",
                    title="Website niet betrouwbaar bereikbaar",
                    evidence=("TLS failure",),
                    business_impact="Bezoekers krijgen geen betrouwbare route naar het bedrijf.",
                    recommendation="Herstel bereikbaarheid.",
                    verified=True,
                ),
            ),
            current_screenshot_data_uri=None,
            source="human-reviewed:pitch-doctor",
        )
        facts = VerifiedFacts(
            company_name=prospect.name,
            category=prospect.category,
            city=prospect.city,
            address=prospect.address,
            website_url=prospect.website_url,
            phone=prospect.phone,
            rating=None,
            review_count=None,
            services=prospect.observed_services,
            brand_colors=(),
            approved_claims=(),
            evidence={},
        )
        brief = ConversionBrief(
            headline="Onderhoud in Utrecht.",
            subheadline="Neem rechtstreeks contact op voor een vraag of project.",
            primary_cta="Bel direct",
            primary_cta_url="tel:0301234567",
            opportunities=("Websitebereikbaarheid herstellen",),
            trust_points=(),
            sections=("hero", "services", "contact"),
        )
        pack = render_print_pack(
            prospect,
            audit,
            brief,
            build_site_config(facts, brief),
            preview_url="https://preview.example.invalid/p/test",
        )
        self.assertIn("Website niet bereikbaar tijdens live audit", pack)
        self.assertIn("Bezoekers krijgen geen betrouwbare route", pack)
        self.assertIn("1 concrete kans die ons opviel", pack)
        self.assertNotIn("Huidige screenshot wordt bij live audit toegevoegd", pack)


class GoldenPipelineTests(unittest.TestCase):
    def test_golden_component_spike(self):
        fixture_dir = Path(__file__).parent / "fixtures" / "golden"
        with tempfile.TemporaryDirectory() as tmp:
            result = run_golden_fixture(fixture_dir, tmp)
            out = Path(tmp)
            self.assertEqual(result["qualification_score"], 20)
            self.assertTrue((out / "preview.html").exists())
            self.assertTrue((out / "print_pack.html").exists())
            self.assertTrue((out / "design_profile.json").exists())
            data = json.loads((out / "pipeline.json").read_text(encoding="utf-8"))
            self.assertNotIn("raw_html", data["verified_facts"])
            self.assertEqual(data["design_profile"]["page_type"], "authority_service")
            self.assertEqual(data["design_profile"]["hero_variant"], "service_split")
            self.assertIn("<svg", (out / "print_pack.html").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
