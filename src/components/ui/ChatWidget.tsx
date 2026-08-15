"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Message {
  role: "user" | "model";
  content: string;
}

interface ChatContextValue {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Owns the chat overlay's open/closed state so it can be triggered from a
 * real nav item (Nav.tsx) instead of an always-visible floating button.
 * Wrap the app once (see layout.tsx); <Nav> and <ChatWidget> both read it
 * via useChat().
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo<ChatContextValue>(
    () => ({
      open,
      openChat: () => setOpen(true),
      closeChat: () => setOpen(false),
      toggleChat: () => setOpen((v) => !v),
    }),
    [open]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}

/**
 * The chat experience itself — rendered as a full-height side panel over a
 * dismissable backdrop, opened only from the "Ask Izanagi" nav entry. No
 * fixed bottom-right bubble, no backdrop-blur glass: a solid, opaque panel
 * that matches the rest of the site's palette.
 */
export function ChatWidget() {
  const t = useTranslations("chat");
  const { open, closeChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeChat();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeChat]);

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

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("close")}
        onClick={closeChat}
        className="fixed inset-0 z-40 bg-zinc-950/80"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-zinc-800 bg-zinc-950 sm:w-[26rem]"
      >
        <div className="flex items-start justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="font-display text-sm font-semibold text-zinc-100">{t("title")}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-accent">
              {t("subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeChat}
            aria-label={t("close")}
            className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            {t("close")}
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
            {t("greeting")}
          </div>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto rounded-tr-sm bg-accent text-zinc-950"
                  : "rounded-tl-sm bg-zinc-900 text-zinc-300"
              }`}
            >
              {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
            </div>
          ))}
          {error && <p className="text-xs text-red-400">{t("error")}</p>}
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
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
          >
            {t("send")}
          </button>
        </form>
      </div>
    </>
  );
}
