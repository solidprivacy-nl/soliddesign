from pathlib import Path


def test_sector_intelligence_launcher_copies_before_opening_chatgpt() -> None:
    source = Path("operator/sector-intelligence-ui.js").read_text(encoding="utf-8")
    start = source.index("document.getElementById('startSectorIntelligence').addEventListener")
    end = source.index("async function submitResearchResult", start)
    handler = source[start:end]

    assert "window.open('about:blank'" not in handler
    assert handler.index("navigator.clipboard.writeText(prompt)") < handler.index(
        "window.open('https://chatgpt.com/'"
    )
