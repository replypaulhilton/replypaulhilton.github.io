// Cloudflare Worker: a tiny proxy between the portfolio chalkboard and Groq.
// It keeps the Groq API key secret, only answers requests from allowed sites,
// and keeps questions and answers short.

import { SYSTEM_PROMPT } from "./prompt.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_QUESTION_CHARS = 500;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 1200;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        }
      : null;

    const url = new URL(request.url);
    if (url.pathname !== "/chat") return json({ error: "Not found" }, 404, cors);
    if (!cors) return json({ error: "Origin not allowed" }, 403, null);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Use POST" }, 405, cors);
    if (!env.GROQ_API_KEY) return json({ error: "Chatbot is not configured yet" }, 500, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, cors);
    }

    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) return json({ error: "Ask a question" }, 400, cors);
    if (question.length > MAX_QUESTION_CHARS) return json({ error: `Keep questions under ${MAX_QUESTION_CHARS} characters` }, 400, cors);

    // Keep only the last few well-formed turns, trimmed, so a visitor can't stuff the prompt
    const history = (Array.isArray(body.history) ? body.history : [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_CHARS) }));

    const model = env.MODEL || "openai/gpt-oss-120b";
    const groqRequest = {
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: question }],
      temperature: 0.6,
      // Reasoning models spend tokens thinking before answering, so leave room for both
      max_completion_tokens: 2500,
    };
    // Short chalkboard answers don't need deep reasoning; keep it quick and cheap
    if (model.startsWith("openai/gpt-oss")) groqRequest.reasoning_effort = "low";

    let groqResponse;
    try {
      groqResponse = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(groqRequest),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      console.log("Groq request failed", e && e.name);
      return json({ error: "Could not reach the AI service" }, 502, cors);
    }

    if (groqResponse.status === 429) return json({ error: "busy" }, 429, cors);
    if (!groqResponse.ok) {
      console.log("Groq error", groqResponse.status, await groqResponse.text());
      return json({ error: "The AI service returned an error" }, 502, cors);
    }

    const data = await groqResponse.json();
    const answer = (data.choices?.[0]?.message?.content || "").trim();
    if (!answer) {
      console.log("Empty answer", data.choices?.[0]?.finish_reason, JSON.stringify(data.usage || {}));
      return json({ error: "Empty answer" }, 502, cors);
    }
    return json({ answer }, 200, cors);
  },
};

function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...(cors || {}) },
  });
}
