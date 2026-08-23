// serve.mjs — zero-dependency static server for the page-agent OpenRouter demo.
// Reads OpenRouter credentials from .env (server-side, never sent to the browser
// in plaintext beyond what page-agent itself needs to call the API directly).
// Usage: node serve.mjs   (or: OPENROUTER_API_KEY=... node serve.mjs)
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const PORT = Number(process.env.PORT) || 4178

// --- tiny .env loader ---
async function loadEnv() {
	try {
		const txt = await readFile(join(ROOT, '.env'), 'utf8')
		for (const line of txt.split('\n')) {
			const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
			if (!m || line.startsWith('#')) continue
			const key = m[1]
			let val = m[2].trim()
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
				val = val.slice(1, -1)
			}
			if (!(key in process.env)) process.env[key] = val
		}
	} catch { /* no .env, fall back to real env vars */ }
}

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
}

function injectConfig(html) {
	const config = {
		model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
		baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
		apiKey: process.env.OPENROUTER_API_KEY || '',
		lang: process.env.PAGE_AGENT_LANG || 'en-US',
		showPanel: (process.env.PAGE_AGENT_SHOW_PANEL ?? 'true') !== 'false',
	}
	const json = JSON.stringify(config)
	return html.replace('/*__PAGE_AGENT_CONFIG__*/ null /*__END__*/', json)
}

const server = createServer(async (req, res) => {
	try {
		let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
		if (urlPath === '/') urlPath = '/index.html'
		const filePath = normalize(join(ROOT, urlPath))
		if (!filePath.startsWith(ROOT)) {
			res.writeHead(403).end('Forbidden')
			return
		}
		const info = await stat(filePath).catch(() => null)
		if (!info || !info.isFile()) {
			res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
			return
		}
		let body = await readFile(filePath)
		const type = MIME[extname(filePath)] || 'application/octet-stream'
		res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' })
		if (filePath.endsWith('index.html')) {
			res.end(injectConfig(body.toString('utf8')))
		} else {
			res.end(body)
		}
	} catch (err) {
		res.writeHead(500, { 'content-type': 'text/plain' }).end('Server error: ' + err.message)
	}
})

await loadEnv()
server.listen(PORT, () => {
	const hasKey = !!process.env.OPENROUTER_API_KEY
	console.log('Page Agent demo running at http://localhost:' + PORT)
	console.log('  model   : ' + (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'))
	console.log('  baseURL : ' + (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'))
	console.log('  apiKey  : ' + (hasKey ? 'loaded from env/.env' : 'MISSING — set OPENROUTER_API_KEY'))
})
