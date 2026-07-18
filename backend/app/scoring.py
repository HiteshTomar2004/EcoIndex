"""Score aggregation for EcoScout.

The overall sustainability score is a transparent weighted average of the three
dimension scores. Keeping this as explicit, defensible code (rather than asking
the LLM for the final number) is a deliberate design choice: the rubric is
auditable and reproducible, which is central to the anti-greenwashing value
proposition.
"""

from __future__ import annotations

from typing import Dict

from .schema import DimensionFindings

# Weights must sum to 1.0. Materials footprint dominates a product's real
# environmental impact, so it carries the most weight.
DIMENSION_WEIGHTS: Dict[str, float] = {
    "materials": 0.45,
    "ethics": 0.30,
    "packaging": 0.25,
}

# Low-confidence findings are pulled toward a neutral 50 so thin evidence can't
# swing the score to an extreme. Factor = how much of the original score we keep.
_CONFIDENCE_FACTOR = {"high": 1.0, "medium": 0.85, "low": 0.6}
_NEUTRAL = 50


def _adjust_for_confidence(findings: DimensionFindings) -> float:
    """Blend a score toward neutral based on evidence confidence."""
    factor = _CONFIDENCE_FACTOR.get(findings.confidence.lower(), 0.85)
    return findings.score * factor + _NEUTRAL * (1 - factor)


def compute_overall_score(
    materials: DimensionFindings,
    ethics: DimensionFindings,
    packaging: DimensionFindings,
) -> int:
    """Weighted, confidence-adjusted average → integer 0-100."""
    adjusted = {
        "materials": _adjust_for_confidence(materials),
        "ethics": _adjust_for_confidence(ethics),
        "packaging": _adjust_for_confidence(packaging),
    }
    total = sum(adjusted[d] * DIMENSION_WEIGHTS[d] for d in DIMENSION_WEIGHTS)
    return max(0, min(100, round(total)))


def score_to_verdict(score: int) -> str:
    """Map a numeric score to a one-word verdict (fallback if LLM omits one)."""
    if score >= 80:
        return "Excellent"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Mixed"
    return "Poor"
