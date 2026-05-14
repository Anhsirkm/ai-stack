# AI Stack — LLM Observability Portfolio

A production-grade AI engineering portfolio project demonstrating eval harness, observability, and local LLM inference.

## Architecture

## Stack

- **Inference**: Ollama (gemma3:4b, nomic-embed-text) — fully local, no cloud API
- **Orchestration**: LangGraph 0.2.28 with StateGraph
- **Backend**: FastAPI 0.115 + Pydantic v2 + SQLAlchemy 2.0 async
- **Database**: pgvector/pgvector:pg16 — vector search ready
- **Cache**: Redis 7
- **Observability**: OpenTelemetry + Prometheus + Grafana
- **Evals**: Promptfoo 0.120.19
- **CI**: GitHub Actions — blocks merge on eval regression
- **Frontend**: Next.js 15 + Tailwind

## Run locally (Mode A — fully offline)

### Prerequisites
- Docker Desktop
- Ollama with gemma3:4b and nomic-embed-text pulled
- Node.js 22+
- Python 3.11+

### Start infrastructure
```bash
docker compose up -d
```

### Start backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Start frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Eval methodology

10 baseline test cases across 4 failure categories:
- **FORMAT** — instruction following, output structure
- **FACTUAL** — verifiable fact accuracy
- **RELEVANCE** — on-topic response
- **REFUSAL** — model doesn't refuse benign queries

Baseline: 10/10 (100%) on gemma3:4b

CI gate blocks merge if pass rate drops >2% from baseline.

## Results

| Model | Pass Rate | Avg Latency | Tokens/sec |
|-------|-----------|-------------|------------|
| gemma3:4b | 100% | ~8s | ~4 |

## Failure taxonomy

See [evals/FAILURE_TAXONOMY.md](evals/FAILURE_TAXONOMY.md) for categorised failure modes from real runs.

## Grafana dashboard

Import [infra/grafana/dashboards/ai-metrics.json](infra/grafana/dashboards/ai-metrics.json) into Grafana at http://localhost:3001

5 panels: tokens/sec, eval pass rate, request rate, latency p50/p95/p99, cost per 1K requests.