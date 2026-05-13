"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.token) {
              full += d.token;
              setMessages((prev) => {
                const u = [...prev];
                u[u.length - 1] = { role: "assistant", content: full };
                return u;
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display:"flex", flexDirection:"column", height:"100vh", backgroundColor:"#030712", color:"#f9fafb", fontFamily:"sans-serif" }}>
      <div style={{ borderBottom:"1px solid #1f2937", padding:"16px 24px" }}>
        <h1 style={{ fontSize:"18px", fontWeight:600, margin:0 }}>AI Stack — Phase 1</h1>
        <p style={{ fontSize:"13px", color:"#6b7280", margin:"4px 0 0" }}>LangGraph + Ollama + FastAPI</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px", display:"flex", flexDirection:"column", gap:"12px" }}>
        {messages.length === 0 && <p style={{ color:"#6b7280", fontSize:"13px" }}>Send a message to start...</p>}
        {messages.map((msg, i) => (
          <div key={i} style={{ maxWidth:"70%", padding:"10px 14px", borderRadius:"10px", fontSize:"14px", whiteSpace:"pre-wrap", lineHeight:1.6, color:"#f9fafb", backgroundColor: msg.role === "user" ? "#2563eb" : "#1f2937", alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.content || (loading && msg.role === "assistant" ? "▋" : "")}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ borderTop:"1px solid #1f2937", padding:"16px 24px", display:"flex", gap:"12px" }}>
        <input
          style={{ flex:1, backgroundColor:"#111827", color:"#f9fafb", border:"1px solid #374151", borderRadius:"8px", padding:"8px 14px", fontSize:"14px", outline:"none" }}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading} style={{ backgroundColor:"#2563eb", color:"#fff", border:"none", borderRadius:"8px", padding:"8px 18px", fontSize:"14px", cursor:"pointer", opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </main>
  );
}