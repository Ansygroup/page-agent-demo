# page-agent-demo (OpenRouter harness)

A self-contained harness that runs **[page-agent](https://github.com/alibaba/page-agent)** —
Alibaba's in-page GUI agent — against **your own OpenRouter (OpenAI-compatible) LLM** on a
sample cinematic storefront. Drop the built bundle into a page and it drives the DOM
(click, type, search, add-to-cart) via natural-language tasks.

> Zero rebuilds. The bundle in `vendor/` is the prebuilt `page-agent.demo.js` IIFE, which
> auto-initializes from `?model&baseURL&apiKey` URL params. Your OpenRouter key is read
> **server-side** from `.env` and injected into the page config — never committed.

## Layout
```
page-agent-demo/
├── index.html              # sample storefront (the DOM surface the agent drives)
├── loader.js               # builds the page-agent <script> from __PAGE_AGENT_CONFIG__
├── serve.mjs               # zero-dep static server; injects OpenRouter config from .env
├── vendor/
│   └── page-agent.demo.js  # prebuilt page-agent IIFE (copied from page-agent/dist)
├── .env.example
└── README.md
```

## Run
```bash
cd ZCodeProject/page-agent-demo
cp .env.example .env          # then paste your OpenRouter key
# (optional) OPENROUTER_API_KEY=sk-or-... node serve.mjs
node serve.mjs
```
Open http://localhost:4178 — the page-agent panel appears bottom-right.

## Try it
In the panel, give a task like:
- **"Search for Nova Air and add it to the cart."**
- **"Subscribe to the newsletter with test@example.com."**
- **"Find the product under $250 and add it to cart."**

## How it wires to OpenRouter
- `serve.mjs` reads `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` / `OPENROUTER_BASE_URL` from
  `.env` (server-side) and injects them into `window.__PAGE_AGENT_CONFIG__`.
- `loader.js` turns that config into `vendor/page-agent.demo.js?model=…&baseURL=…&apiKey=…`.
- The bundle calls OpenRouter **directly from the browser** (OpenRouter sends CORS headers),
  so no backend proxy is needed for the LLM calls.

## Rebuild the bundle (optional)
If you change `page-agent` source and want a fresh bundle:
```bash
cd ZCodeProject/page-agent
npm run build:demo
cp packages/page-agent/dist/iife/page-agent.demo.js ../page-agent-demo/vendor/
```

## Notes
- Default model: `openai/gpt-4o-mini` (cheap, tool-call capable). Swap in `.env`
  (e.g. `anthropic/claude-3.5-sonnet`, `google/gemini-flash-1.5`).
- OpenRouter sends CORS-friendly responses; no extra proxy config required.
- Never commit `.env`. The `.env.example` is safe.

## Verified (live, 2026-08-23)
- `node serve.mjs` boots; injects OpenRouter config server-side (key never committed).
- Real browser: page-agent panel mounts; `window.pageAgent` reports `status=idle`,
  `apiKey` length 73, model `openai/gpt-4o-mini`.
- **Live task run**: "Search for Nova Air and add it to the cart." → agent reached
  `status=completed` with 0 errors, mutating the DOM (cart incremented) via real
  OpenRouter LLM calls. The sample cart is an idempotent `Set` so repeated clicks
  don't double-count the same product.
