---
name: portfolio-site-project
description: "Hilton's live portfolio site on GitHub Pages and its Cloudflare Worker chatbot (where things live, as of 2026-10-24)"
metadata:
  node_type: memory
  type: project
  originSessionId: d6d35a4d-d982-4047-a783-0d3c56e39782
  modified: 2026-10-24T18:11:11.314Z
---

Live site: https://replypaulhilton.github.io (repo replypaulhilton/replypaulhilton.github.io, branch main, single index.html).
Chatbot: Cloudflare Worker "hilton-chat" at https://hilton-chat.hiltonpaul.workers.dev/chat calling Groq (model openai/gpt-oss-120b, reasoning_effort low); code in worker/ of the same repo; key is the GROQ_API_KEY secret. ALLOWED_ORIGINS limits callers to the site and localhost:8742.
Features: chalkboard/whiteboard theme with eraser wipe, chalk-written headings, clickable hero diagram, animated cartoon guide using his face (hilton-face.png cut from hilton-at-the-board.webp), tour, AI answers drawn as chalk flow diagrams with voice.

**Why:** his personal brand for an Associate Architect / AI-based applications role (studying for AI-103).
**How to apply:** keep new work in the same style ([[chalkboard-visual-style]]); push only when he says push; commit messages follow his CLAUDE.md format. LinkedIn posts: studio.html (unlisted, noindex) renders chalkboard post images (1080x1350 or 1080x1080) with a watermark of his face + name + site, a "Follow for more system design" line, AI-generated title/flow/trade-offs/caption via the same Worker, and PNG download. Style and project notes are also kept in the repo's notes/ folder.
