// Reads stored git credential, checks the latest CI run status for the repo.
const { execSync } = require('child_process')
const https = require('https')
const fs = require('fs')

function getToken() {
	const raw = execSync('git config --get credential.helper').toString().trim()
	const storeFile = raw.replace(/^store,?/, '') || require('os').homedir() + '/.git-credentials'
	const l = fs.readFileSync(storeFile, 'utf8').split('\n').find((x) => x.includes('github.com'))
	return l.match(/https:\/\/[^:]+:([^@]+)@/)[1]
}

function get(path) {
	return new Promise((res, rej) => {
		https
			.get({
				hostname: 'api.github.com',
				path,
				headers: { Authorization: 'Bearer ' + getToken(), 'User-Agent': 'ci-check' },
			}, (r) => {
				let d = ''
				r.on('data', (c) => (d += c))
				r.on('end', () => res({ status: r.statusCode, body: JSON.parse(d) }))
			})
			.on('error', rej)
	})
}

;(async () => {
	const runs = await get('/repos/Ansygroup/page-agent-demo/actions/runs?per_page=3')
	if (runs.status !== 200) {
		console.log('API status', runs.status)
		process.exit(1)
	}
	runs.body.workflow_runs.forEach((r) =>
		console.log(`run ${r.id} | ${r.event} | ${r.status} | conclusion=${r.conclusion} | ${r.head_sha.slice(0, 7)}`)
	)
})()
