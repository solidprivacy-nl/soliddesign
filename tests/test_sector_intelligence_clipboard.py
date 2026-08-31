from pathlib import Path


def test_sector_intelligence_launcher_copies_before_opening_chatgpt() -> None:
    source = Path("operator/discovery-sectors.js").read_text(encoding="utf-8")
    start = source.index("startButton.addEventListener('click'")
    end = source.index("async function submitResult", start)
    handler = source[start:end]

    assert "window.open('about:blank'" not in handler
    assert handler.index("navigator.clipboard.writeText(prompt)") < handler.index(
        "window.open('https://chatgpt.com/'"
    )
