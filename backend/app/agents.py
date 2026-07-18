"""LLM, search tool, and specialist-agent logic for EcoScout.

Each specialist agent follows the same shape:
  1. Run one Tavily web search scoped to its dimension.
  2. Feed the search snippets to Gemini with a dimension-specific prompt.
  3. Return structured `DimensionFindings` + the citations it used.

Keeping the agents as plain async functions (rather than full LangChain
AgentExecutors) keeps the graph fast, cheap, and easy to reason about — the
"agentic" structure lives in the LangGraph orchestration, not in per-node
tool-calling loops.
"""

from __future__ import annotations

import os
from typing import List, Tuple

from langchain_google_genai import ChatGoogleGenerativeAI
from tavily import TavilyClient

from .schema import (
    Citation,
    DimensionFindings,
    NormalizedProduct,
    SynthesisOutput,
)

# --------------------------------------------------------------------------- #
# Lazy singletons — created on first use so imports don't require keys.
# --------------------------------------------------------------------------- #
_llm: ChatGoogleGenerativeAI | None = None
_tavily: TavilyClient | None = None


def get_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY is not set.")
        _llm = ChatGoogleGenerativeAI(
            model=model,
            api_key=api_key,
            temperature=0.2,
            max_retries=2,
        )
    return _llm


def get_tavily() -> TavilyClient:
    global _tavily
    if _tavily is None:
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise RuntimeError("TAVILY_API_KEY is not set.")
        _tavily = TavilyClient(api_key=api_key)
    return _tavily


def _max_results() -> int:
    try:
        return int(os.getenv("MAX_SEARCH_RESULTS", "4"))
    except ValueError:
        return 4


# --------------------------------------------------------------------------- #
# Search helper
# --------------------------------------------------------------------------- #
async def web_search(query: str, dimension: str) -> Tuple[str, List[Citation]]:
    """Run a Tavily search and return (context_text, citations).

    Tavily's client is sync; we call it directly (fast, single request). The
    returned context is a compact string of titles + snippets for the LLM.
    """
    client = get_tavily()
    try:
        resp = client.search(
            query=query,
            max_results=_max_results(),
            search_depth="basic",
        )
    except Exception as exc:  # network / quota — degrade gracefully
        return (f"(Search unavailable: {exc})", [])

    results = resp.get("results", [])
    citations: List[Citation] = []
    lines: List[str] = []
    for r in results:
        title = r.get("title", "Untitled")
        url = r.get("url", "")
        content = (r.get("content", "") or "")[:500]
        lines.append(f"- {title}: {content}")
        if url:
            citations.append(Citation(title=title, url=url, dimension=dimension))

    context = "\n".join(lines) if lines else "(No results found.)"
    return context, citations


# --------------------------------------------------------------------------- #
# Prompts
# --------------------------------------------------------------------------- #
INTAKE_PROMPT = """You are the intake analyst for a sustainability tool.
Given a raw product input (a name, description, or URL), normalize it.

Raw input: {product}

Identify the clean product name, the brand (or "Unknown"), a product category
(e.g. apparel, electronics, food, cosmetics, home goods), and a short list of
the materials the product is *likely* made of. Do not invent a specific brand
if it is not present in the input."""

DIMENSION_PROMPTS = {
    "materials": """You are a materials-sustainability specialist.
Assess the MATERIALS & manufacturing footprint of this product.

Product: {product} (brand: {brand}, category: {category})
Likely materials: {materials}

Web research findings:
{context}

Score 0-100 where 100 = excellent (recycled/organic/renewable, low CO2 & water,
durable) and 0 = terrible (virgin plastic, high-emission, resource-intensive).
Ground every claim in the findings above. If evidence is thin, lower your
confidence and say so. Be skeptical of marketing claims (greenwashing).""",
    "ethics": """You are a brand-ethics & labor specialist.
Assess the BRAND'S ethical & environmental practices for this product.

Product: {product} (brand: {brand}, category: {category})

Web research findings:
{context}

Consider labor practices, supply-chain transparency, certifications (Fair Trade,
B-Corp, etc.), and any controversies. Score 0-100 (100 = exemplary ethics,
0 = documented serious harm). If the brand is Unknown or evidence is thin, give
a neutral score (~50) and set confidence low. Watch for greenwashing.""",
    "packaging": """You are a packaging & end-of-life specialist.
Assess the PACKAGING, recyclability, and end-of-life of this product.

Product: {product} (brand: {brand}, category: {category})

Web research findings:
{context}

Consider packaging materials, recyclability, repairability, product lifespan,
and disposal. Score 0-100 (100 = minimal/recyclable/repairable/long-lived,
0 = excessive single-use plastic, non-recyclable, disposable).""",
}

SEARCH_QUERIES = {
    "materials": "{product} {brand} materials sustainability environmental impact manufacturing",
    "ethics": "{brand} {category} labor practices ethics certifications controversies sustainability",
    "packaging": "{product} {brand} packaging recyclable end of life durability repairability",
}

SYNTHESIS_PROMPT = """You are the lead sustainability analyst synthesizing a report
for a shopper.

Product: {product} (brand: {brand}, category: {category})

Dimension assessments:
- Materials ({materials_score}/100): {materials_summary}
- Brand ethics ({ethics_score}/100): {ethics_summary}
- Packaging/end-of-life ({packaging_score}/100): {packaging_summary}

The computed overall score is {overall_score}/100.

Write a concise 3-4 sentence overall verdict for the shopper, then suggest 2-3
GREENER, genuinely purchasable alternatives (real product types or brands known
for sustainability in this category). For each alternative give a one-line reason
and an approximate score. Choose a one-word verdict: Excellent | Good | Mixed | Poor."""


# --------------------------------------------------------------------------- #
# Agent functions (structured output via Gemini)
# --------------------------------------------------------------------------- #
async def run_intake(product: str) -> NormalizedProduct:
    llm = get_llm().with_structured_output(NormalizedProduct)
    prompt = INTAKE_PROMPT.format(product=product)
    return await llm.ainvoke(prompt)


async def run_specialist(
    dimension: str,
    product: str,
    brand: str,
    category: str,
    materials: List[str],
) -> Tuple[DimensionFindings, List[Citation]]:
    """Search + assess one sustainability dimension."""
    query = SEARCH_QUERIES[dimension].format(
        product=product, brand=brand, category=category
    )
    context, citations = await web_search(query, dimension)

    prompt = DIMENSION_PROMPTS[dimension].format(
        product=product,
        brand=brand,
        category=category,
        materials=", ".join(materials) if materials else "unknown",
        context=context,
    )
    llm = get_llm().with_structured_output(DimensionFindings)
    findings = await llm.ainvoke(prompt)
    return findings, citations


async def run_synthesis(
    product: str,
    brand: str,
    category: str,
    materials_findings: DimensionFindings,
    ethics_findings: DimensionFindings,
    packaging_findings: DimensionFindings,
    overall_score: int,
) -> SynthesisOutput:
    prompt = SYNTHESIS_PROMPT.format(
        product=product,
        brand=brand,
        category=category,
        materials_score=materials_findings.score,
        materials_summary=materials_findings.summary,
        ethics_score=ethics_findings.score,
        ethics_summary=ethics_findings.summary,
        packaging_score=packaging_findings.score,
        packaging_summary=packaging_findings.summary,
        overall_score=overall_score,
    )
    llm = get_llm().with_structured_output(SynthesisOutput)
    return await llm.ainvoke(prompt)
