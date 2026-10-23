# hilton-chat: chalkboard chatbot

A tiny Cloudflare Worker that sits between the portfolio site and Groq. It keeps the Groq API key secret, only answers requests from the portfolio, and keeps answers short enough to write on the chalkboard.

Both services are free to start: Cloudflare Workers (free plan) and Groq (free plan, limited requests per day).

## One-time setup

1. Create a free Groq account at https://console.groq.com and make an API key (API Keys → Create). Copy it somewhere safe; Groq shows it only once.
2. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up.
3. In a terminal, from this `worker` folder:

```bash
npx wrangler login
```

A browser window opens; sign in to Cloudflare and allow access.

```bash
npx wrangler secret put GROQ_API_KEY
```

Paste your Groq key when asked. It's stored encrypted in Cloudflare, never in this repo.

```bash
npx wrangler deploy
```

The output ends with your Worker address, like `https://hilton-chat.<your-name>.workers.dev`.

4. In `index.html`, set the chatbot address (add `/chat` to the end):

```js
const CHAT_ENDPOINT = "https://hilton-chat.<your-name>.workers.dev/chat";
```

Commit and push, and the chalkboard answers for real.

## Changing things later

- **What the bot says about you, and its style:** edit `src/prompt.js`, then run `npx wrangler deploy`.
- **Model:** change `MODEL` in `wrangler.toml` (see https://console.groq.com/docs/models), then deploy.
- **Allowed sites:** `ALLOWED_ORIGINS` in `wrangler.toml`. Add your custom domain here if you get one.
- **Usage and errors:** Cloudflare dashboard → Workers → hilton-chat → Logs, or run `npx wrangler tail`.

## Limits and safety

- Only the sites in `ALLOWED_ORIGINS` get answers. Note that this stops other websites from using your bot, but not someone calling it from a script. If you ever see abuse in the logs, add a Cloudflare rate-limiting rule.
- Questions are capped at 500 characters, and only the last 6 messages of a conversation are sent.
- When Groq's free limit is reached, visitors see "Lots of questions right now!" instead of an error.
