"""FastAPI entrypoint for EcoScout.

Exposes:
  GET  /health          — liveness probe (used by Render).
  POST /analyze         — run the graph, return the full JSON result.
  POST /analyze/stream  — Server-Sent Events: stream agent activity live, then
                          emit the final result. Powers the frontend's "watch
                          the agents work" feed.

The streaming endpoint uses LangGraph's `astream` with `stream_mode="updates"`,
emitting one SSE event per node completion so the UI reflects the parallel
agents finishing in real time.
"""

from __future__ import annotations

import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

load_dotenv()  # load .env before importing modules that read env at call time

from .graph import graph  # noqa: E402
from .schema import (  # noqa: E402
    AnalysisResult,
    AnalyzeRequest,
    Citation,
    DimensionScore,
)

app = FastAPI(title="EcoScout API", version="1.0.0")

# CORS — restrict to the configured frontend origins.
origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _accumulate(state: dict, delta: dict) -> None:
    """Merge a node's streamed delta into the running state.

    In `stream_mode="updates"`, each event carries only one node's raw return
    value — NOT the reducer-merged state. So we must replicate the graph's
    reducers here: list-valued keys (citations, activity_log) are appended;
    everything else is overwritten. Without this, parallel agents' citations
    would clobber each other and only the last one would survive.
    """
    for key, value in delta.items():
        if key in ("citations", "activity_log") and isinstance(value, list):
            state.setdefault(key, [])
            state[key].extend(value)
        else:
            state[key] = value


def _build_result(product: str, final_state: dict) -> AnalysisResult:
    """Convert the graph's final state into the API response model."""
    dims = []
    for dim_name, key in (
        ("materials", "materials_findings"),
        ("ethics", "ethics_findings"),
        ("packaging", "packaging_findings"),
    ):
        f = final_state.get(key)
        if f is not None:
            dims.append(
                DimensionScore(
                    dimension=dim_name,
                    score=f.score,
                    summary=f.summary,
                    key_findings=f.key_findings,
                )
            )

    # De-duplicate citations by URL.
    seen: set[str] = set()
    citations: list[Citation] = []
    for c in final_state.get("citations", []):
        if c.url and c.url not in seen:
            seen.add(c.url)
            citations.append(c)

    return AnalysisResult(
        product=product,
        normalized_product=final_state.get("normalized_product", product),
        category=final_state.get("category", "unknown"),
        overall_score=final_state.get("overall_score", 0),
        verdict=final_state.get("verdict", "Unknown"),
        summary=final_state.get("summary", ""),
        dimensions=dims,
        alternatives=final_state.get("alternatives", []),
        citations=citations,
    )


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ecoscout", "version": "1.0.0"}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(req: AnalyzeRequest):
    """Run the full graph and return the complete result (non-streaming)."""
    try:
        final_state = await graph.ainvoke({"product": req.product})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
    return _build_result(req.product, final_state)


@app.post("/analyze/stream")
async def analyze_stream(req: AnalyzeRequest):
    """Stream agent activity as SSE, then a final `result` event."""

    async def event_generator():
        accumulated: dict = {}
        try:
            async for update in graph.astream(
                {"product": req.product}, stream_mode="updates"
            ):
                # `update` is {node_name: state_delta}
                for node_name, delta in update.items():
                    if not isinstance(delta, dict):
                        continue
                    _accumulate(accumulated, delta)
                    for line in delta.get("activity_log", []):
                        yield {
                            "event": "activity",
                            "data": json.dumps({"node": node_name, "message": line}),
                        }

            result = _build_result(req.product, accumulated)
            yield {"event": "result", "data": result.model_dump_json()}
        except Exception as exc:
            yield {"event": "error", "data": json.dumps({"detail": str(exc)})}

    return EventSourceResponse(event_generator())
