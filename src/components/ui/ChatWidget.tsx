"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "model";
  content: string;
}

export function ChatWidget() {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setError(false);
    setInput("");
    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...nextMessages, { role: "model", content: "" }]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) throw new Error("chat request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: "model", content: accumulated }]);
      }
    } catch {
      setError(true);
      setMessages(nextMessages);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("launcherLabel")}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/90 px-5 py-3 text-sm font-medium text-zinc-100 shadow-[0_0_30px_rgba(124,58,237,0.25)] backdrop-blur-md transition hover:border-zinc-500"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "linear-gradient(135deg, #7C3AED, #22D3EE)" }}
        />
        {open ? t("close") : t("launcherLabel")}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[min(32rem,70vh)] w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="font-display text-sm font-semibold text-zinc-100">{t("title")}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
              {t("subtitle")}
            </p>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
              {t("greeting")}
            </div>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto rounded-tr-sm bg-gradient-to-br from-violet-600 to-cyan-600 text-white"
                    : "rounded-tl-sm bg-zinc-900 text-zinc-300"
                }`}
              >
                {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
            {error && (
              <p className="text-xs text-red-400">{t("error")}</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-zinc-800 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="shrink-0 rounded-full bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
            >
              {t("send")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
