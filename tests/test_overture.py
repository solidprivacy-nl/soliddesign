import unittest

from soliddesign.discovery.overture import (
    _build_query,
    _row_to_prospect,
    _validate_release,
    parse_bbox,
)


class OvertureDiscoveryTests(unittest.TestCase):
    def test_bbox_order_and_validation(self):
        self.assertEqual(parse_bbox("4.9,52.0,5.2,52.2"), (4.9, 52.0, 5.2, 52.2))
        with self.assertRaises(ValueError):
            parse_bbox("4.9,52.0,4.8,52.2")

    def test_release_identifier_is_strict(self):
        self.assertEqual(_validate_release("2026-07-22.0"), "2026-07-22.0")
        with self.assertRaises(ValueError):
            _validate_release("latest'; DROP TABLE x; --")

    def test_row_normalizes_overture_place(self):
        row = (
            "gers-1",
            "Voorbeeld Installatie BV",
            "electrician",
            "electrical_contractor",
            ["voorbeeld.nl"],
            ["+31 30 123 4567"],
            "Voorbeeldstraat 1",
            "Utrecht",
            0.87,
            "open",
        )
        prospect = _row_to_prospect(row, "2026-07-22.0")
        assert prospect is not None
        self.assertEqual(prospect.id, "overture:gers-1")
        self.assertEqual(prospect.website_url, "https://voorbeeld.nl")
        self.assertEqual(prospect.discovery_source, "overture")
        self.assertEqual(prospect.discovery_version, "2026-07-22.0")
        self.assertEqual(prospect.source_confidence, 0.87)
        self.assertIsNone(prospect.rating)
        self.assertIsNone(prospect.review_count)

    def test_closed_or_website_less_places_are_rejected(self):
        base = ("id", "Name", "electrician", "electrician", ["https://example.nl"], [], "", "", 0.0)
        self.assertIsNone(_row_to_prospect((*base, "permanently_closed"), "2026-07-22.0"))
        no_site = ("id", "Name", "electrician", "electrician", [], [], "", "", 0.9, "open")
        self.assertIsNone(_row_to_prospect(no_site, "2026-07-22.0"))

    def test_query_uses_new_taxonomy_not_deprecated_categories(self):
        sql, params = _build_query(
            release="2026-07-22.0",
            west=4.9,
            south=52.0,
            east=5.2,
            north=52.2,
            categories=("electrician",),
            name_contains=None,
            limit=25,
        )
        self.assertIn("basic_category", sql)
        self.assertIn("taxonomy.primary", sql)
        self.assertNotIn("categories.primary", sql)
        self.assertEqual(params[-4:], ["electrician"] * 4)


if __name__ == "__main__":
    unittest.main()
