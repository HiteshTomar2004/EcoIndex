"""Pydantic models and the LangGraph state definition for EcoScout.

The graph state is a TypedDict (LangGraph's preferred state container). The
parallel specialist nodes each write to a *distinct* key so their concurrent
writes never collide. `citations` and `activity_log` use reducers so parallel
branches can append without overwriting each other.
"""

from __future__ import annotations

import operator
from typing import Annotated, List, Optional

from pydantic import BaseModel, Field
from typing_extensions import TypedDict


# --------------------------------------------------------------------------- #
# API-facing request/response models
# --------------------------------------------------------------------------- #
class AnalyzeRequest(BaseModel):
    """Body for POST /analyze."""

    product: str = Field(
        ...,
        min_length=2,
        max_length=2000,
        description="Product name, description, or URL to analyze.",
    )


class Citation(BaseModel):
    """A single evidence source surfaced by a specialist agent."""

    title: str
    url: str
    dimension: str  # which agent found it: materials | ethics | packaging


class DimensionScore(BaseModel):
    """Score + reasoning for one sustainability dimension."""

    dimension: str
    score: int = Field(ge=0, le=100)
    summary: str
    key_findings: List[str] = Field(default_factory=list)


class Alternative(BaseModel):
    """A greener product suggestion."""

    name: str
    reason: str
    approx_score: Optional[int] = Field(default=None, ge=0, le=100)


class AnalysisResult(BaseModel):
    """The final payload returned to the frontend."""

    product: str
    normalized_product: str
    category: str
    overall_score: int = Field(ge=0, le=100)
    verdict: str  # e.g. "Good", "Mixed", "Poor"
    summary: str
    dimensions: List[DimensionScore]
    alternatives: List[Alternative]
    citations: List[Citation]


# --------------------------------------------------------------------------- #
# Internal structures the specialist agents return (LLM structured output)
# --------------------------------------------------------------------------- #
class NormalizedProduct(BaseModel):
    """Output of the intake node."""

    normalized_product: str = Field(description="Clean product name/description.")
    brand: str = Field(default="Unknown", description="Brand if identifiable.")
    category: str = Field(description="Product category, e.g. 'apparel', 'electronics'.")
    materials_guess: List[str] = Field(
        default_factory=list,
        description="Likely materials, for the materials agent to verify.",
    )


class DimensionFindings(BaseModel):
    """What each specialist agent produces after researching."""

    score: int = Field(ge=0, le=100, description="0=very unsustainable, 100=excellent.")
    summary: str = Field(description="2-3 sentence plain-English assessment.")
    key_findings: List[str] = Field(
        default_factory=list, description="Bullet facts, grounded in the search results."
    )
    confidence: str = Field(
        default="medium", description="low | medium | high — based on evidence quality."
    )


class SynthesisOutput(BaseModel):
    """The synthesizer's alternatives (score is computed separately)."""

    verdict: str = Field(description="One word: Excellent | Good | Mixed | Poor.")
    summary: str = Field(description="3-4 sentence overall assessment for the shopper.")
    alternatives: List[Alternative] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# LangGraph state
# --------------------------------------------------------------------------- #
class GraphState(TypedDict, total=False):
    """Shared state passed between graph nodes.

    Parallel specialist nodes write to their own findings key. The list-valued
    `citations` and `activity_log` keys use `operator.add` reducers so the
    concurrent branches append instead of clobbering one another.
    """

    # inputs
    product: str

    # after intake
    normalized_product: str
    brand: str
    category: str
    materials_guess: List[str]

    # specialist outputs (one key each — no write conflicts)
    materials_findings: DimensionFindings
    ethics_findings: DimensionFindings
    packaging_findings: DimensionFindings

    # accumulated across parallel branches
    citations: Annotated[List[Citation], operator.add]
    activity_log: Annotated[List[str], operator.add]

    # after synthesizer
    overall_score: int
    verdict: str
    summary: str
    alternatives: List[Alternative]
