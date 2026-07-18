# 🌱 EcoScout — Sustainable Shopping Analyst

An **agentic AI** application for **UN SDG 12 (Responsible Consumption & Production)**.
Paste any product and EcoScout returns an evidence-backed **sustainability score (0–100)**
with a transparent breakdown and greener alternatives — powered by a **multi-agent
LangGraph** that researches materials, brand ethics, and packaging in parallel.

> *"A CarFax + nutrition label for the sustainability of anything you buy."*

Built for the IBM Agentic AI Workloads internship.

## Architecture

```
React (Vercel)  ──HTTPS/SSE──►  FastAPI + LangGraph (Render)

                intake ──┬── materials ─┐
                         ├── ethics ────┼── synthesizer ──► score + alternatives
                         └── packaging ─┘
                        (parallel agents, live web research via Tavily)
```

- **Frontend:** React + Vite + Tailwind — paper-cut eco theme, live agent activity feed.
- **Backend:** FastAPI + LangGraph multi-agent graph, SSE streaming.
- **LLM:** Google Gemini (Flash). **Search:** Tavily. Both free-tier.

## Repo layout
| Path | What |
|---|---|
| `backend/` | LangGraph API — see `backend/README.md` |
| `frontend/` | React UI — see `frontend/README.md` |
| `PLAN.md` | Full project plan & design |
| `LEAN_CANVAS.md` | Business model (Lean Canvas) |

## Quick start (local)
```bash
# backend
cd backend && python -m venv .venv && .venv/Scripts/activate   # (Windows)
pip install -r requirements.txt
cp .env.example .env        # add GOOGLE_API_KEY + TAVILY_API_KEY
uvicorn app.main:app --reload

# frontend (separate terminal)
cd frontend && npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm run dev                 # http://localhost:5173
```

## Deployment
Backend → **Render** (`backend/render.yaml`). Frontend → **Vercel** (root dir `frontend`).
See deployment steps in the project notes.
