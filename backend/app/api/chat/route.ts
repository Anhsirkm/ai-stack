import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { message, model } = await req.json();

  const backendRes = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, model: model || "gemma3:4b" }),
  });

  if (!backendRes.ok) {
    return new Response("Backend error", { status: 500 });
  }

  return new Response(backendRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}