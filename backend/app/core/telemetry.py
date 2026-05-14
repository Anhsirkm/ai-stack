from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import FastAPI, Response
import time

# Resource
resource = Resource.create({"service.name": "ai-stack-backend"})

# Tracer provider
provider = TracerProvider(resource=resource)

# OTLP exporter — sends to Prometheus/Grafana stack
otlp_exporter = OTLPSpanExporter(
    endpoint="http://localhost:4318/v1/traces",
)
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
trace.set_tracer_provider(provider)

tracer = trace.get_tracer("ai-stack")

# Prometheus metrics
REQUEST_COUNT = Counter(
    "ai_stack_requests_total",
    "Total requests",
    ["endpoint", "model", "status"]
)

INFERENCE_LATENCY = Histogram(
    "ai_stack_inference_latency_seconds",
    "Inference latency in seconds",
    ["model"],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0]
)

TOKEN_COUNT = Counter(
    "ai_stack_tokens_total",
    "Total tokens generated",
    ["model"]
)

EVAL_PASS_RATE = Histogram(
    "ai_stack_eval_pass_rate",
    "Eval pass rate per run",
    buckets=[0.1, 0.2, 0.5, 0.7, 0.8, 0.9, 0.95, 1.0]
)


def instrument_fastapi(app: FastAPI):
    FastAPIInstrumentor.instrument_app(app)


def record_inference(model: str, latency: float, token_count: int, success: bool):
    status = "success" if success else "error"
    REQUEST_COUNT.labels(endpoint="/api/chat", model=model, status=status).inc()
    INFERENCE_LATENCY.labels(model=model).observe(latency)
    TOKEN_COUNT.labels(model=model).inc(token_count)


def metrics_endpoint():
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )