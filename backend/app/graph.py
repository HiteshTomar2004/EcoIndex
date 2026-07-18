"""The EcoScout multi-agent LangGraph.

Topology:

    intake
      │
      ├──────────┬──────────────┐   (parallel fan-out)
      ▼          ▼              ▼
  materials    ethics       packaging
      │          │              │
      └──────────┴──────────────┘   (implicit join)
                 ▼
            synthesizer
                 ▼
                END

The three specialist nodes run concurrently because they all depend only on
`intake` and write to distinct state keys. LangGraph automatically joins them
before running `synthesizer`. This parallel fan-out is the core "agentic
workload" — independent agents researching in parallel, then a synthesizer
reasoning over their combined findings.
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from . import agents
from .schema import (
    Alternative,
    DimensionFindings,
    GraphState,
)
from .scoring import compute_overall_score, score_to_verdict


# --------------------------------------------------------------------------- #
# Nodes
# --------------------------------------------------------------------------- #
async def intake_node(state: GraphState) -> GraphState:
    """Normalize the raw product input into structured fields."""
    product = state["product"]
    norm = await agents.run_intake(product)
    return {
        "normalized_product": norm.normalized_product,
        "brand": norm.brand,
        "category": norm.category,
        "materials_guess": norm.materials_guess,
        "activity_log": [f"Intake: identified '{norm.normalized_product}' "
                         f"({norm.category}, brand: {norm.brand})"],
    }


def _make_specialist_node(dimension: str, findings_key: str):
    """Factory that builds a specialist node for a given dimension."""

    async def node(state: GraphState) -> GraphState:
        findings, citations = await agents.run_specialist(
            dimension=dimension,
            product=state.get("normalized_product", state["product"]),
            brand=state.get("brand", "Unknown"),
            category=state.get("category", "unknown"),
            materials=state.get("materials_guess", []),
        )
        return {
            findings_key: findings,
            "citations": citations,
            "activity_log": [
                f"{dimension.capitalize()} agent: scored {findings.score}/100 "
                f"({findings.confidence} confidence, {len(citations)} sources)"
            ],
        }

    node.__name__ = f"{dimension}_node"
    return node


materials_node = _make_specialist_node("materials", "materials_findings")
ethics_node = _make_specialist_node("ethics", "ethics_findings")
packaging_node = _make_specialist_node("packaging", "packaging_findings")


def _fallback_findings() -> DimensionFindings:
    """Neutral placeholder if a specialist somehow produced nothing."""
    return DimensionFindings(
        score=50,
        summary="Insufficient data to assess this dimension.",
        key_findings=[],
        confidence="low",
    )


async def synthesizer_node(state: GraphState) -> GraphState:
    """Combine the three dimension findings into a final scored report."""
    materials = state.get("materials_findings") or _fallback_findings()
    ethics = state.get("ethics_findings") or _fallback_findings()
    packaging = state.get("packaging_findings") or _fallback_findings()

    overall = compute_overall_score(materials, ethics, packaging)

    synthesis = await agents.run_synthesis(
        product=state.get("normalized_product", state["product"]),
        brand=state.get("brand", "Unknown"),
        category=state.get("category", "unknown"),
        materials_findings=materials,
        ethics_findings=ethics,
        packaging_findings=packaging,
        overall_score=overall,
    )

    verdict = synthesis.verdict or score_to_verdict(overall)
    alternatives = synthesis.alternatives or [
        Alternative(name="No specific alternative found",
                    reason="Try searching for certified sustainable options in this category.",
                    approx_score=None)
    ]

    return {
        "overall_score": overall,
        "verdict": verdict,
        "summary": synthesis.summary,
        "alternatives": alternatives,
        "activity_log": [f"Synthesizer: overall {overall}/100 ({verdict})"],
    }


# --------------------------------------------------------------------------- #
# Graph assembly
# --------------------------------------------------------------------------- #
def build_graph():
    """Compile and return the EcoScout LangGraph."""
    g = StateGraph(GraphState)

    g.add_node("intake", intake_node)
    g.add_node("materials", materials_node)
    g.add_node("ethics", ethics_node)
    g.add_node("packaging", packaging_node)
    g.add_node("synthesizer", synthesizer_node)

    g.add_edge(START, "intake")

    # Parallel fan-out: all three specialists depend only on intake.
    g.add_edge("intake", "materials")
    g.add_edge("intake", "ethics")
    g.add_edge("intake", "packaging")

    # Implicit join: synthesizer waits for all three before running.
    g.add_edge("materials", "synthesizer")
    g.add_edge("ethics", "synthesizer")
    g.add_edge("packaging", "synthesizer")

    g.add_edge("synthesizer", END)

    return g.compile()


# Module-level compiled graph (reused across requests).
graph = build_graph()
