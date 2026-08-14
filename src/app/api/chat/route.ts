import { GoogleGenAI } from "@google/genai";
import { retrieveContext, RAG_EMBED_MODEL } from "@/lib/rag";

export const runtime = "nodejs";

const GENERATION_MODEL = "gemini-3.6-flash";
const MAX_HISTORY_TURNS = 12;

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const SYSTEM_PROMPT = `You are the official assistant embedded on the Izanagi AI marketing site (izanagi-ai npm package — an agent/skill framework for autonomous software engineering, 21 specialized agents, CLI \`izanagi\`).

Answer only using the CONTEXT block you're given below each user message — it's retrieved live from the framework's real docs, agent definitions and skill descriptions. If the context doesn't cover something, say so honestly instead of guessing or inventing commands, flags, or features that aren't in it.

Style: concise, conversational, no markdown headers, short paragraphs or a tight bullet list at most. Always reply in the same language the user just wrote in (Portuguese, English, or Spanish). When relevant, nudge toward trying it: \`npx izanagi init\`. Never claim to be a general-purpose model — you are specifically Izanagi's product assistant.`;

function buildPrompt(context: string, userMessage: string) {
  return `CONTEXT (retrieved from the Izanagi AI framework docs):\n${context}\n\nUSER QUESTION:\n${userMessage}`;
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return new Response("Chat is not configured.", { status: 503 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return new Response("Missing user message.", { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  let contextText = "(no matching context found)";
  try {
    const embedRes = await ai.models.embedContent({
      model: RAG_EMBED_MODEL,
      contents: lastUser.content,
      config: { taskType: "RETRIEVAL_QUERY", outputDimensionality: 768 },
    });
    const queryVector = embedRes.embeddings?.[0]?.values;
    if (queryVector) {
      const chunks = retrieveContext(queryVector, 6);
      contextText = chunks.map((c) => c.text).join("\n\n---\n\n");
    }
  } catch {
    // Retrieval is best-effort — fall back to answering without it rather
    // than failing the whole request.
  }

  const history = messages.slice(-MAX_HISTORY_TURNS, -1);
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    {
      role: "user" as const,
      parts: [{ text: buildPrompt(contextText, lastUser.content) }],
    },
  ];

  let stream;
  const generateParams = {
    model: GENERATION_MODEL,
    contents,
    config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.4 },
  };
  try {
    stream = await ai.models.generateContentStream(generateParams);
  } catch (err) {
    // The free-tier model occasionally 503s under load — one quiet retry
    // covers that transient case instead of surfacing it to the user.
    const message = err instanceof Error ? err.message : String(err);
    const isTransient = message.includes("503") || message.includes("429");
    if (!isTransient) {
      console.error("Gemini generateContentStream failed:", err);
      return new Response("The assistant is temporarily unavailable.", { status: 502 });
    }
    try {
      await new Promise((r) => setTimeout(r, 1200));
      stream = await ai.models.generateContentStream(generateParams);
    } catch (retryErr) {
      console.error("Gemini generateContentStream failed after retry:", retryErr);
      return new Response("The assistant is temporarily unavailable.", { status: 502 });
    }
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        console.error("Gemini stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
