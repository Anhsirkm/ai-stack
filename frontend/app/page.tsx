"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  fileName?: string;
}

const MODELS = [
  { id: "gemma3:4b", label: "Gemma 3 4B" },
  { id: "qwen2.5-coder:7b-instruct-q4_K_M", label: "Qwen 2.5 Coder 7B" },
  { id: "qwen2.5-coder:1.5b", label: "Qwen 2.5 Coder 1.5B" },
  { id: "qwen2.5:7b", label: "Qwen 2.5 7B" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("gemma3:4b");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setFileContent(text);
    setFileName(file.name);
  }

  function clearFile() {
    setFileContent(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    const fullMessage = fileContent
      ? `File: ${fileName}\n\n${fileContent}\n\nUser: ${userMessage}`
      : userMessage;

    // Capture history BEFORE adding new messages (avoids empty placeholder leaking in)
    const currentHistory = messages
      .filter((m) => m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, fileName: fileName || undefined },
    ]);
    clearFile();
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: fullMessage,
          model,
          history: currentHistory,
        }),
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
    <main style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#030712", color: "#f9fafb", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1f2937", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>AI Stack — Phase 1</h1>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0" }}>LangGraph + Ollama + FastAPI</p>
        </div>
        {/* Model switcher */}
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{ backgroundColor: "#111827", color: "#f9fafb", border: "1px solid #374151", borderRadius: "8px", padding: "6px 10px", fontSize: "13px", cursor: "pointer", outline: "none" }}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && (
          <p style={{ color: "#6b7280", fontSize: "13px" }}>Send a message to start. You can attach a file too.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ maxWidth: "70%", alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.fileName && (
              <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "4px", textAlign: "right" }}>
                📎 {msg.fileName}
              </div>
            )}
            <div style={{ padding: "10px 14px", borderRadius: "10px", fontSize: "14px", whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#f9fafb", backgroundColor: msg.role === "user" ? "#2563eb" : "#1f2937" }}>
              {msg.content || (loading && msg.role === "assistant" ? "▋" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* File preview bar */}
      {fileName && (
        <div style={{ backgroundColor: "#111827", borderTop: "1px solid #1f2937", padding: "8px 24px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <span style={{ color: "#9ca3af" }}>📎 {fileName}</span>
          <button onClick={clearFile} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
            ✕ Remove
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: "1px solid #1f2937", padding: "16px 24px", display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.py,.js,.ts,.json,.csv,.pdf"
          onChange={handleFile}
          style={{ display: "none" }}
          id="file-upload"
        />
        <label htmlFor="file-upload" style={{ backgroundColor: "#1f2937", color: "#9ca3af", border: "1px solid #374151", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>
          📎 File
        </label>
        <input
          style={{ flex: 1, backgroundColor: "#111827", color: "#f9fafb", border: "1px solid #374151", borderRadius: "8px", padding: "8px 14px", fontSize: "14px", outline: "none" }}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "14px", cursor: "pointer", opacity: loading ? 0.6 : 1, whiteSpace: "nowrap" }}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </main>
  );
}