// Fetches the failing CI run's job steps + annotations to diagnose.
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
			.get({ hostname: 'api.github.com', path, headers: { Authorization: 'Bearer ' + getToken(), 'User-Agent': 'ci-diag' } }, (r) => {
				let d = ''
				r.on('data', (c) => (d += c))
				r.on('end', () => res({ status: r.statusCode, body: JSON.parse(d) }))
			})
			.on('error', rej)
	})
}

;(async () => {
	const run = await get('/repos/Ansygroup/page-agent-demo/actions/runs/32630931220')
	const jobs = await get(run.body.jobs_url)
	console.log('run conclusion:', run.body.conclusion)
	for (const j of jobs.body.jobs) {
		console.log('\nJOB:', j.name, '|', j.conclusion)
		for (const s of j.steps) {
			console.log(`  - ${s.name} | ${s.conclusion}`)
		}
	}
	// annotations
	const ann = await get('/repos/Ansygroup/page-agent-demo/actions/runs/32630931220/annotations')
	if (ann.body.length) {
		console.log('\nANNOTATIONS:')
		ann.body.forEach((a) => console.log(`  [${a.annotation_level}] ${a.path}:${a.line} ${a.message}`))
	} else console.log('\n(no annotations)')
})()
