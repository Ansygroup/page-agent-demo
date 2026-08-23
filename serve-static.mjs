// Minimal static server for the built dist/ folder (verifies deployable output).
// Usage: node serve-static.mjs   (serves ./dist on :4180)
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', 'dist')
const PORT = Number(process.env.PORT) || 4180
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }

createServer(async (req, res) => {
	const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0]
	const filePath = normalize(join(ROOT, urlPath))
	if (!filePath.startsWith(ROOT)) {
		res.writeHead(403).end('Forbidden')
		return
	}
	try {
		const body = await readFile(filePath)
		res.writeHead(200, { 'content-type': MIME[extname(filePath)] || 'application/octet-stream' })
		res.end(body)
	} catch {
		res.writeHead(404).end('Not found')
	}
}).listen(PORT, () => console.log(`dist static server on http://localhost:${PORT}`))
