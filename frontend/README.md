# EcoScout Frontend

React + Vite + Tailwind UI for the EcoScout sustainable-shopping analyst.
Paper-cut layered-green eco theme.

## Setup

```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_URL to your backend
npm run dev               # http://localhost:5173
```

`VITE_API_URL` must point to the backend (default `http://localhost:8000`).

## Features
- **Live agent feed** — streams each LangGraph node's progress via SSE, so you
  watch the parallel agents (materials / ethics / packaging) finish in real time.
- **Score gauge** — animated 0–100 sustainability ring with verdict.
- **Dimension bars** — per-agent scores + key findings.
- **Greener alternatives** — actionable swaps.
- **Evidence** — every source cited, grouped by agent.

## Build & Deploy (Vercel)
```bash
npm run build      # outputs dist/
```
On Vercel: import the repo, set **Root Directory** to `frontend`, add env var
`VITE_API_URL` = your Render backend URL. `vercel.json` handles SPA rewrites.

## Theme tokens (tailwind.config.js)
`lime · fresh · leaf · forest · deep · cream · sun` — layered paper-cut greens.
