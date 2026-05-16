import json
import time
import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List, Optional
from app.core.config import settings
from app.core.telemetry import tracer, record_inference

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    model: str = "gemma3:4b"
    history: Optional[List[ChatMessage]] = []


async def stream_ollama(message: str, model: str, history: list):
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": message})

    token_count = 0
    start = time.time()
    success = False

    with tracer.start_as_current_span("ollama_inference") as span:
        span.set_attribute("model", model)
        span.set_attribute("message_length", len(message))
        span.set_attribute("history_length", len(history))
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{settings.ollama_base_url}/api/chat",
                    json={"model": model, "messages": messages, "stream": True},
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            token = data.get("message", {}).get("content", "")
                            if token:
                                token_count += 1
                                yield f"data: {json.dumps({'token': token})}\n\n"
                            if data.get("done"):
                                success = True
                                return
                        except json.JSONDecodeError:
                            continue
        finally:
            latency = time.time() - start
            span.set_attribute("token_count", token_count)
            span.set_attribute("latency_seconds", latency)
            record_inference(model, latency, token_count, success)


@router.post("/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        stream_ollama(request.message, request.model, request.history or []),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )


@router.post("/eval")
async def eval_chat(request: ChatRequest):
    messages = [{"role": "user", "content": request.message}]
    start = time.time()
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{settings.ollama_base_url}/api/chat",
            json={"model": request.model, "messages": messages, "stream": False},
        )
        response.raise_for_status()
        data = response.json()
        content = data.get("message", {}).get("content", "")
    latency = time.time() - start
    record_inference(request.model, latency, len(content.split()), True)
    return PlainTextResponse(content)


@router.get("/health")
async def health():
    return {"status": "ok"}