from __future__ import annotations

from enum import StrEnum


class ProspectState(StrEnum):
    DISCOVERED = "DISCOVERED"
    QUALIFIED = "QUALIFIED"
    DISQUALIFIED = "DISQUALIFIED"
    AUDITED = "AUDITED"
    SELECTED = "SELECTED"
    DEMO_READY = "DEMO_READY"
    PRINT_READY = "PRINT_READY"
    MAILED = "MAILED"
    VISITED = "VISITED"
    RESPONDED = "RESPONDED"
    MEETING = "MEETING"
    PROPOSAL = "PROPOSAL"
    WON = "WON"
    LOST = "LOST"
