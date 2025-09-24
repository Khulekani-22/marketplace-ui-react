import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { answerQuestion, assistantSuggestions, classifyScope } from "./aiKnowledge";
import { api } from "../../lib/api";
import "./assistant.css";

export default function AIAssistant({ isAdmin, tenantId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(() => [
    { role: "assistant", text: "Hi! I can help with vendor and basic tenant features. Ask me about adding listings, managing listings, profiles, subscriptions, academy, or support." },
  ]);
  const endRef = useRef(null);

  const ctx = useMemo(() => ({ isAdmin: !!isAdmin, tenantId: tenantId || sessionStorage.getItem("tenantId") || "vendor" }), [isAdmin, tenantId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendQuestion(text) {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    // Guardrails first (client-side)
    const scope = classifyScope(q, ctx);
    if (!scope.allowed) {
      const res = answerQuestion(q, ctx);
      setMessages((m) => [...m, { role: "assistant", text: res.text, type: res.type }]);
      setBusy(false);
      return;
    }
    // Try backend AI; fallback to local
    try {
      const { data } = await api.post("/api/assistant/ask", {
        question: q,
        tenantId: ctx.tenantId,
        isAdmin: ctx.isAdmin,
      });
      const text = typeof data?.text === "string" ? data.text : null;
      if (text) {
        setMessages((m) => [...m, { role: "assistant", text, type: data?.type || "answer" }]);
      } else {
        const res = answerQuestion(q, ctx);
        setMessages((m) => [...m, { role: "assistant", text: res.text, type: res.type }]);
      }
    } catch {
      const res = answerQuestion(q, ctx);
      setMessages((m) => [...m, { role: "assistant", text: res.text, type: res.type }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sl-ai-root" aria-live="polite">
      {/* Toggle button */}
      <button
        className="sl-ai-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sl-ai-panel"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        <Icon icon="solar:chat-round-dots-line-duotone" className="sl-ai-toggle-icon" />
        <span className="sl-ai-toggle-text d-none d-sm-inline">Ask Sloane</span>
      </button>

      {open && (
        <div id="sl-ai-panel" className="sl-ai-panel" role="dialog" aria-label="Sloane Assistant">
          <div className="sl-ai-header">
            <div className="d-flex align-items-center gap-2">
              <Icon icon="solar:chat-round-dots-line-duotone" className="text-primary" />
              <strong>Sloane Assistant</strong>
              <span className="badge bg-secondary ms-2">Vendor & Basic</span>
            </div>
            <button className="btn btn-sm btn-light" onClick={() => setOpen(false)} aria-label="Close">
              <Icon icon="radix-icons:cross-2" />
            </button>
          </div>

          <div className="sl-ai-body">
            <div className="sl-ai-messages">
              {messages.map((m, i) => (
                <div key={i} className={"sl-ai-msg " + (m.role === "user" ? "user" : "assistant")}> 
                  <div className="sl-ai-bubble">
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="sl-ai-msg assistant">
                  <div className="sl-ai-bubble sl-ai-typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="sl-ai-suggestions">
              {assistantSuggestions.map((s, idx) => (
                <button key={idx} className="btn btn-sm btn-outline-secondary" onClick={() => sendQuestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form
            className="sl-ai-input"
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion();
            }}
          >
            <input
              type="text"
              placeholder="Ask about vendor or basic tenant features…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Ask your question"
              disabled={busy}
            />
            <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
              <Icon icon="mi:send" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
