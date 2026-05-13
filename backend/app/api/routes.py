import json
import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    model: str = "gemma3:4b"


async def stream_ollama(message: str, model: str):
    messages = [{"role": "user", "content": message}]

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
                        yield f"data: {json.dumps({'token': token})}\n\n"
                    if data.get("done"):
                        yield f"data: {json.dumps({'done': True})}\n\n"
                        return
                except json.JSONDecodeError:
                    continue


@router.post("/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        stream_ollama(request.message, request.model),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )


@router.get("/health")
async def health():
    return {"status": "ok"}
