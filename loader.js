// loader.js — injects page-agent.demo.js with OpenRouter config from the page.
// The demo bundle auto-initializes: it reads ?model &baseURL &apiKey from ITS OWN
// <script> src, then spawns `window.pageAgent` and shows the panel.
//
// The bundle lives next to loader.js in a static build (dist/page-agent.demo.js)
// but under vendor/ in dev (vendor/page-agent.demo.js). We probe the flat path
// first and fall back to vendor/ so the same loader works in both layouts.
(function () {
	const cfg = window.__PAGE_AGENT_CONFIG__ || {}
	if (!cfg.model || !cfg.baseURL) {
		console.warn('[page-agent-demo] No model/baseURL — agent not loaded.')
		return
	}
	const params = new URLSearchParams({
		model: cfg.model,
		baseURL: cfg.baseURL,
		apiKey: cfg.apiKey || 'NA',
		lang: cfg.lang || 'en-US',
		showPanel: String(cfg.showPanel !== false),
	})

	const s = document.createElement('script')
	const flat = './page-agent.demo.js?' + params.toString()
	const vendored = './vendor/page-agent.demo.js?' + params.toString()

	s.async = false
	s.onerror = () => {
		// flat path failed (dev layout) → retry under vendor/
		const v = document.createElement('script')
		v.async = false
		v.src = vendored
		document.head.appendChild(v)
	}
	s.src = flat
	document.head.appendChild(s)
	console.log('[page-agent-demo] loading page-agent with model=' + cfg.model)
})()
