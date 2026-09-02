from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_clean_chatgpt_preview_acceptance_contract_is_documented() -> None:
    fixture = read("tests/fixtures/ai_provider_boundary_preview.md")

    assert "PR-specific `/start-design` URL" in fixture
    assert "no GitHub connector" in fixture
    assert "does not discover or inspect underlying SolidDesign source repositories" in fixture
    assert "Passing this preview acceptance validates workflow behavior" in fixture
