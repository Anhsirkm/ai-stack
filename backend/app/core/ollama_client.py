import httpx
from app.core.config import settings


async def chat_stream(messages: list[dict], model: str = None):
    model = model or settings.ollama_model
    url = f"{settings.ollama_base_url}/api/chat"

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            url,
            json={"model": model, "messages": messages, "stream": True},
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_lines():
                if chunk:
                    yield chunk


async def embed(text: str, model: str = None) -> list[float]:
    model = model or settings.ollama_embed_model
    url = f"{settings.ollama_base_url}/api/embeddings"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            json={"model": model, "prompt": text},
        )
        response.raise_for_status()
        return response.json()["embedding"]