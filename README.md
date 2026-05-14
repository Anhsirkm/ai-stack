# AI Stack LLM Observability Portfolio

A production-grade AI engineering portfolio demonstrating eval harness, observability, and local LLM inference.

## Architecture

Browser -> Next.js (3000) -> FastAPI (8000) -> LangGraph -> Ollama (11434)
                                     |
                           Prometheus metrics -> Grafana dashboards
                                     |
                           Promptfoo eval suite -> GitHub Actions CI gate

## Stack

- Inference: Ollama gemma3:4b and nomic-embed-text fully local no cloud API
- Orchestration: LangGraph 0.2.28 with StateGraph
- Backend: FastAPI 0.115 + Pydantic v2 + SQLAlchemy 2.0 async
- Database: pgvector pg16
- Cache: Redis 7
- Observability: OpenTelemetry + Prometheus + Grafana
- Evals: Promptfoo 0.120.19
- CI: GitHub Actions blocks merge on eval regression
- Frontend: Next.js 15 + Tailwind

## Run locally

Start infrastructure: docker compose up -d

Start backend: cd backend then venv\Scripts\activate then uvicorn app.main:app --reload --port 8000

Start frontend: cd frontend then npm install then npm run dev

Open http://localhost:3000

## Eval methodology

10 baseline test cases across 4 failure categories FORMAT FACTUAL RELEVANCE REFUSAL
Baseline 10/10 100 percent on gemma3:4b
CI gate blocks merge if pass rate drops more than 2 percent from baseline

## Results

Model gemma3:4b Pass Rate 100 percent Avg Latency 8s

## Failure taxonomy

See evals/FAILURE_TAXONOMY.md for categorised failure modes from real runs.

## Grafana dashboard

Import infra/grafana/dashboards/ai-metrics.json into Grafana at http://localhost:3001
5 panels tokens per sec eval pass rate request rate latency p50 p95 p99 cost per 1K requests
