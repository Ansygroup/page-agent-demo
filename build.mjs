/**
 * Build-time config injector.
 *
 * For STATIC hosts (Vercel/Netlify/Cloudflare Pages) there is no per-request
 * server to inject the OpenRouter key, so we bake it into dist/index.html.
 *
 * Usage:  node build.mjs
 * Reads OPENROUTER_* from .env (or the environment) and writes dist/index.html
 * with the config inlined next to the PAGE_AGENT_CONFIG marker.
 *
 * After building, deploy `dist/` as a static site and set the OpenRouter key
 * as a build-time environment variable (see DEPLOY.md).
 */
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))

async function loadEnv() {
	try {
		const txt = await readFile(join(ROOT, '.env'), 'utf8')
		for (const line of txt.split('\n')) {
			if (!line.trim() || line.trimStart().startsWith('#')) continue
			const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
			if (!m) continue
			const key = m[1]
			let val = m[2].trim()
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
				val = val.slice(1, -1)
			}
			if (!(key in process.env)) process.env[key] = val
		}
	} catch {
		/* no .env — rely on process.env */
	}
}

async function main() {
	await loadEnv()
	const apiKey = process.env.OPENROUTER_API_KEY || ''
	if (!apiKey) {
		throw new Error('OPENROUTER_API_KEY is not set. Add it to .env or the build environment.')
	}
	const config = {
		model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
		baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
		apiKey,
		lang: process.env.PAGE_AGENT_LANG || 'en-US',
		showPanel: (process.env.PAGE_AGENT_SHOW_PANEL ?? 'true') !== 'false',
	}
	const json = JSON.stringify(config)

	await mkdir(join(ROOT, 'dist'), { recursive: true })

	// copy static assets
	const vendorSrc = join(ROOT, 'vendor', 'page-agent.demo.js')
	await copyFile(vendorSrc, join(ROOT, 'dist', 'page-agent.demo.js'))
	await copyFile(join(ROOT, 'loader.js'), join(ROOT, 'dist', 'loader.js'))

	const html = await readFile(join(ROOT, 'index.html'), 'utf8')
	const out = html.replace('/*__PAGE_AGENT_CONFIG__*/ null /*__END__*/', json)
	if (out === html) {
		throw new Error('Inject marker /*__PAGE_AGENT_CONFIG__*/ not found in index.html')
	}
	await writeFile(join(ROOT, 'dist', 'index.html'), out)

	console.log('✓ built dist/ (static, key inlined) — safe to deploy to any static host')
	console.log('  model:', config.model, '| apiKey len:', apiKey.length)
}

main().catch((e) => {
	console.error('build failed:', e.message)
	process.exit(1)
})
