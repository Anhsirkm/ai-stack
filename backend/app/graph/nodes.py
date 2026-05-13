import json
import httpx
from app.core.config import settings
from app.graph.state import ChatState


async def ollama_node(state: ChatState) -> ChatState:
    messages = [
        {
            "role": m.type if hasattr(m, "type") else m["role"],
            "content": m.content if hasattr(m, "content") else m["content"]
        }
        for m in state["messages"]
    ]

    model = state.get("model", settings.ollama_model)
    collected = ""

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{settings.ollama_base_url}/api/chat",
            json={"model": model, "messages": messages, "stream": True},
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line:
                    data = json.loads(line)
                    if token := data.get("message", {}).get("content", ""):
                        collected += token

    return {"messages": [{"role": "assistant", "content": collected}]}