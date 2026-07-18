# EcoScout — Sustainable Shopping Analyst Agent
### IBM Agentic AI Internship Project · UN SDG 12 (Responsible Consumption & Production)

---

## 1. The Problem (SDG 12)
Consumers *want* to buy sustainably but can't. Sustainability information is scattered, inconsistent, and full of **greenwashing**. Checking a single product means cross-referencing materials, brand labor/environmental practices, certifications, packaging, and end-of-life — nobody does this manually at the point of purchase.

**Top 3 problems**
1. Sustainability data is fragmented across dozens of sources and hard to trust.
2. "Green" marketing claims are often unverified (greenwashing).
3. Shoppers have no quick, objective way to compare a product to greener alternatives *while shopping*.

## 2. The Solution
**EcoScout** — an AI agent that takes any product (name or URL) and returns an evidence-backed **Sustainability Score (0–100)** with a plain-English breakdown and 2–3 greener alternatives.

Because sustainability has multiple independent dimensions, we use a **multi-agent LangGraph** where specialist agents research different dimensions **in parallel**, then a synthesizer scores and recommends. This is the "agentic workload" showcase — orchestration, parallel tool use, and reasoning over retrieved evidence.

**"X for Y" one-liner:** *"A CarFax + nutrition label for the sustainability of anything you buy."*

## 3. Unique Value Proposition
> **See past the greenwashing. Every product gets an honest, evidence-backed sustainability score in seconds — with greener swaps you can actually buy.**

Differentiators: multi-agent parallel research, live web evidence (not just LLM memory), transparent citations, and a concrete score instead of vague eco-labels.

---

## 4. Technical Architecture

```
┌────────────────────────────┐         ┌──────────────────────────────────────┐
│   React Frontend (Vercel)  │  HTTPS  │      FastAPI + LangGraph (Render)     │
│                            │ ──────► │                                       │
│  • Product input (name/URL)│   SSE   │   ┌────────── Orchestrator ────────┐  │
│  • Live agent activity feed│ ◄────── │   │ 1. Intake / normalize product │  │
│  • Score card + breakdown  │ stream  │   └───────────────┬────────────────┘  │
│  • Alternatives cards      │         │        ┌──────────┼──────────┐        │
│  • Citations               │         │        ▼          ▼          ▼        │
└────────────────────────────┘         │   Materials   Brand      Packaging    │  ← parallel
                                        │    Agent      Ethics      /EOL Agent  │    specialist
                                        │      │        Agent          │        │    agents
                                        │      └──────────┼────────────┘        │    (Tavily tool)
                                        │                 ▼                      │
                                        │        ┌─────────────────┐            │
                                        │        │  Synthesizer:   │            │
                                        │        │  score + ranked │            │
                                        │        │  alternatives   │            │
                                        │        └─────────────────┘            │
                                        └──────────────────────────────────────┘
```

### The LangGraph (multi-agent) design
- **State**: `{ product, normalized_product, materials_findings, ethics_findings, packaging_findings, alternatives, final_score, breakdown, citations, activity_log }`
- **Nodes**
  1. `intake` — normalize the input (name/URL → structured product: category, brand, materials guess).
  2. `materials_agent` — researches material footprint (recycled? virgin plastic? organic? water/CO₂ intensity).
  3. `ethics_agent` — researches brand labor practices, certifications (Fair Trade, B-Corp), controversies.
  4. `packaging_agent` — researches packaging, recyclability, and end-of-life/repairability.
  5. `synthesizer` — weighs the three findings into a 0–100 score + breakdown, then researches & ranks greener alternatives.
- **Edges**: `intake → [materials, ethics, packaging] (parallel fan-out) → synthesizer → END`
- **Tool**: Tavily web search, shared by the three specialist agents.
- **Streaming**: LangGraph `astream_events` → SSE → the frontend "activity feed" so the audience *sees* the agents working (huge for the demo).

### Stack
| Layer | Choice | Notes |
|---|---|---|
| LLM | **Gemini 3.1 Flash** (`langchain-google-genai`) | fast, cheap, strong tool-calling |
| Orchestration | **LangGraph** | multi-agent graph, parallel fan-out |
| Search tool | **Tavily** (free tier) | live evidence + citations |
| Backend | **FastAPI**, SSE streaming | deploy on **Render** |
| Frontend | **React + Vite + Tailwind** | deploy on **Vercel** |
| Config | `.env` (keys), CORS locked to Vercel origin | |

---

## 5. Repository Layout
```
IBM_Project/
├── PLAN.md                 ← this file
├── LEAN_CANVAS.md          ← filled Lean Canvas (feeds the PPT)
├── backend/
│   ├── app/
│   │   ├── main.py         ← FastAPI, /analyze SSE endpoint, CORS
│   │   ├── graph.py        ← LangGraph definition (nodes + edges)
│   │   ├── agents.py       ← specialist agent prompts + Tavily tool
│   │   ├── schema.py       ← Pydantic state & response models
│   │   └── scoring.py      ← score aggregation logic
│   ├── requirements.txt
│   ├── .env.example
│   └── render.yaml         ← Render deploy config
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/  (SearchBar, ActivityFeed, ScoreCard, AlternativeCard, Citations)
    │   └── api.js          ← SSE client to backend
    ├── package.json
    ├── vite.config.js
    └── .env.example        ← VITE_API_URL
```

---

## 6. Build Phases
1. **Docs** — PLAN.md + LEAN_CANVAS.md ✅ (this step)
2. **Backend skeleton** — FastAPI + health check, `.env`, requirements.
3. **LangGraph core** — state, 3 specialist agents + synthesizer, run locally via a CLI test.
4. **Streaming API** — `/analyze` SSE endpoint emitting activity events + final result.
5. **Frontend** — React UI: search → live activity feed → score card + alternatives + citations.
6. **Wire & test locally** — end-to-end with real keys.
7. **Deploy** — backend to Render, frontend to Vercel, fix CORS/env.
8. **PPT** — build the Lean Canvas slide + architecture + demo screenshots.

---

## 7. Key Metrics (for the canvas & demo)
- Products analyzed / week
- Avg. analysis latency (target < 20s)
- % analyses with ≥3 cited sources (trust)
- Alternative click-through rate
- User-reported "changed my purchase" rate (impact proxy)

## 8. Risks & Mitigations
- **Greenwashing / wrong facts** → require citations; synthesizer must ground claims in Tavily results, hedge when evidence is thin.
- **Render free tier cold starts** → show a "waking up" state; pre-warm before the demo.
- **Latency from parallel LLM calls** → parallel fan-out (not sequential) + Flash model keeps it fast.
- **API cost** → Gemini Flash + Tavily free tiers; cap searches per agent.

## 9. Explicitly Out of Scope (internship timeline)
Auth/accounts, payment, browser extension, mobile app, persistent DB/history. These become the "roadmap" slide.
