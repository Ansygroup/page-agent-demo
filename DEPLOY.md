# Deploy — page-agent-demo

A self-contained in-page GUI agent storefront. Two deployment shapes, depending
on whether your host can run a Node server.

---

## A. Static host (Vercel / Netlify / Cloudflare Pages) — RECOMMENDED

No server needed. The OpenRouter key is baked into the built HTML at build time.

1. Set the build environment variable:
   - `OPENROUTER_API_KEY` = your `sk-or-...` key
   - (optional) `OPENROUTER_MODEL`, `PAGE_AGENT_LANG`
2. Build command: `node build.mjs`
3. Publish directory: `dist`

Config files are already wired:
- `vercel.json` → build `node build.mjs`, output `dist`, key stored as a project
  env var (`@openrouter_api_key`).
- `netlify.toml` → build `node build.mjs`, publish `dist`.

> The key lives in the shipped HTML, so it is exposed to the browser (required,
> since the agent calls OpenRouter directly from the client). Keep the key
> **scoped + revocable**, and rotate if leaked.

---

## B. Container / long-running host (Railway / Render / Docker)

The Node server injects the key per-request (never committed to disk in the
image). Best when you want to rotate the key via env vars without rebuilding.

- **Railway**: `railway.json` present. Set `OPENROUTER_API_KEY` in the service
  env. Deploys via the Dockerfile.
- **Render**: `render.yaml` present. Connect repo, set `OPENROUTER_API_KEY`,
  deploy.
- **Plain Docker**:
  ```bash
  docker build -t page-agent-demo .
  docker run -e OPENROUTER_API_KEY=sk-or-... -p 4178:4178 page-agent-demo
  ```
- **Docker Compose**:
  ```bash
  export OPENROUTER_API_KEY=sk-or-...
  docker compose up
  ```

Local dev still uses `node serve.mjs` (runtime injection from `.env`).

---

## Verify a deploy
Open the deployed URL, open DevTools console, and run:
```js
window.pageAgent.config.apiKey.length   // > 0  → key is present
window.pageAgent.status                // "idle"
```
Then type a task in the panel and confirm the cart/UI updates.
