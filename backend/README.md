# EcoScout Backend

Multi-agent LangGraph API that scores product sustainability (UN SDG 12).

## Architecture

```
intake ──┬── materials ─┐
         ├── ethics ────┼── synthesizer ── END
         └── packaging ─┘
        (parallel fan-out)
```

- **intake** — normalizes the product (name/URL → brand, category, materials).
- **materials / ethics / packaging** — three specialist agents run **in parallel**, each doing a live Tavily web search + Gemini assessment for its dimension.
- **synthesizer** — computes a transparent weighted score and recommends greener alternatives.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # then fill in your keys
```

You need two free API keys in `.env`:
- `GOOGLE_API_KEY` — https://aistudio.google.com/app/apikey
- `TAVILY_API_KEY` — https://app.tavily.com

## Run

**Quick CLI test (no server):**
```bash
python -m app.run_cli "Nike Air Force 1 sneakers"
```

**API server:**
```bash
uvicorn app.main:app --reload
```

Then:
```bash
# non-streaming
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"product":"Nike Air Force 1 sneakers"}'

# health
curl http://localhost:8000/health
```

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness probe |
| POST | `/analyze` | Full JSON result (non-streaming) |
| POST | `/analyze/stream` | SSE: live agent activity, then final `result` event |

## Deploy (Render)
`render.yaml` is a ready blueprint. In the Render dashboard set the secret env
vars (`GOOGLE_API_KEY`, `TAVILY_API_KEY`, `ALLOWED_ORIGINS` → your Vercel URL).

## Scoring rubric
Overall = weighted, confidence-adjusted average:
`materials 45% · ethics 30% · packaging 25%` (see `app/scoring.py`).
Low-confidence findings are pulled toward a neutral 50 so thin evidence can't
swing the result. The number is computed in code (not by the LLM) so it's
auditable — central to the anti-greenwashing pitch.
