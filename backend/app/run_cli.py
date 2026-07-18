"""Local CLI to exercise the EcoScout graph end-to-end without the API.

Usage:
    cd backend
    python -m app.run_cli "Nike Air Force 1 sneakers"
    python -m app.run_cli            # uses a default sample product

Requires GOOGLE_API_KEY and TAVILY_API_KEY in your environment or .env.
"""

from __future__ import annotations

import asyncio
import sys

from dotenv import load_dotenv

# Windows terminals often default to cp1252, which can't encode emoji. Force
# UTF-8 on stdout so the CLI output renders everywhere.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

load_dotenv()

from .graph import graph  # noqa: E402


async def main(product: str) -> None:
    print(f"\n🔍 Analyzing: {product}\n" + "-" * 60)

    # Stream node updates so you can see the parallel agents finish.
    # In "updates" mode each event is one node's raw delta (not reducer-merged),
    # so we merge list keys by appending — mirroring the graph's reducers.
    accumulated: dict = {}
    async for update in graph.astream({"product": product}, stream_mode="updates"):
        for node_name, delta in update.items():
            if isinstance(delta, dict):
                for key, value in delta.items():
                    if key in ("citations", "activity_log") and isinstance(value, list):
                        accumulated.setdefault(key, [])
                        accumulated[key].extend(value)
                    else:
                        accumulated[key] = value
                for line in delta.get("activity_log", []):
                    print(f"  • {line}")

    print("-" * 60)
    print(f"\n📊 OVERALL SCORE: {accumulated.get('overall_score')}/100 "
          f"({accumulated.get('verdict')})")
    print(f"\n{accumulated.get('summary')}\n")

    for key, label in (
        ("materials_findings", "Materials"),
        ("ethics_findings", "Brand Ethics"),
        ("packaging_findings", "Packaging/EOL"),
    ):
        f = accumulated.get(key)
        if f:
            print(f"  [{label}] {f.score}/100 — {f.summary}")

    print("\n🌱 Greener alternatives:")
    for alt in accumulated.get("alternatives", []):
        score = f" (~{alt.approx_score})" if alt.approx_score else ""
        print(f"  - {alt.name}{score}: {alt.reason}")

    citations = accumulated.get("citations", [])
    print(f"\n📎 {len(citations)} sources gathered.")


if __name__ == "__main__":
    product_arg = sys.argv[1] if len(sys.argv) > 1 else "Nike Air Force 1 sneakers"
    asyncio.run(main(product_arg))
