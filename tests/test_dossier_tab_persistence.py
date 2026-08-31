from pathlib import Path


def test_dossier_tab_is_restored_after_detail_rerender() -> None:
    source = Path("operator/dossier-tabs.js").read_text(encoding="utf-8")

    assert "window.sessionStorage.setItem" in source
    assert "window.sessionStorage.getItem" in source
    assert "root.dataset.dossierProspectId = prospect.id" in source
    assert "pendingWorkTab || storedTab(prospect.id) || 'overview'" in source


def test_tab_activation_persists_selected_tab() -> None:
    source = Path("operator/dossier-tabs.js").read_text(encoding="utf-8")
    start = source.index("function activateTab")
    end = source.index("function eventDescription", start)
    handler = source[start:end]

    assert "rememberTab(root.dataset.dossierProspectId, target)" in handler
