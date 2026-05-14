from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.telemetry import instrument_fastapi, metrics_endpoint


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Backend starting up...")
    yield
    print("Backend shutting down...")


app = FastAPI(
    title="AI Stack",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

instrument_fastapi(app)
app.include_router(router, prefix="/api")


@app.get("/metrics")
async def metrics():
    return metrics_endpoint()