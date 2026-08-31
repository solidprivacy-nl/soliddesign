from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_browser_and_handoff_contracts_do_not_expose_repository_hosts() -> None:
    browser_contracts = [
        "operator/start-design.html",
        "operator/design-process.js",
        "operator/sector-intelligence-ui.js",
        "prompts/SOLIDDESIGN_BOOTSTRAP.md",
    ]

    for path in browser_contracts:
        source = read(path).lower()
        assert "github.com" not in source, path
        assert "raw.githubusercontent.com" not in source, path
        assert "api.github.com" not in source, path


def test_design_resources_are_served_through_the_cms_origin() -> None:
    start = read("operator/start-design.html")
    bootstrap = read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
    design = read("operator/design-process.js")
    deploy = read(".github/workflows/deploy-operator.yml")

    assert 'href="/prompts/SOLIDDESIGN_BOOTSTRAP.md"' in start
    assert "https://soliddesign-cms.pages.dev/prompts/" in bootstrap
    assert "https://soliddesign-cms.pages.dev/sector-intelligence/" in bootstrap
    assert "`${window.location.origin}/sector-intelligence`" in design
    assert "cp -R prompts operator/prompts" in deploy
    assert "cp -R sector-intelligence operator/sector-intelligence" in deploy


def test_provider_transport_remains_server_only() -> None:
    server = read("operator/functions/api/sector-intelligence.js").lower()
    ui = read("operator/sector-intelligence-ui.js").lower()

    assert "api.github.com" in server
    assert "api.github.com" not in ui
    assert "source_url" not in ui
    assert "review_url" not in ui
