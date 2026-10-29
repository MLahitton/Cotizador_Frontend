import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import loadingRegression from './workspace-loading-browser.mjs';
import * as f from './fixtures/workspace-loading.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(process.env.WORKSPACE_BROWSER_OUTPUT || path.join(root, 'test-results/workspace-loading'));
await mkdir(output, { recursive: true });
const reservation = net.createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: root, windowsHide: true, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
let readyResolve, readyReject;
const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
const collect = data => { serverLog += data.toString(); if (/Ready in/.test(serverLog)) readyResolve(); };
server.stdout.on('data', collect); server.stderr.on('data', collect);
server.on('error', readyReject);
const exited = once(server, 'exit');
server.once('exit', code => readyReject(new Error(`Own Next server exited before readiness: ${code}`)));
let browser;
let state = 'Running', reads = 0, writes = 0, active = 0, maxActive = 0, rejectReleased = false;
let armed, release = () => {};
const releases = new Set();
const results = [], errors = [], unexpected = [];
let passed = false;
const timeout = setTimeout(() => readyReject(new Error('Own Next server did not become ready')), 60000);
try {
  await ready;
  clearTimeout(timeout);
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem('sng.auth.access_token', 'synthetic-fixture-token'));
  // Intercept all API traffic before allowing only this process's Next assets/pages.
  await context.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url()); const p = url.pathname;
    if (!p.startsWith('/api/')) return url.origin === origin ? route.continue() : route.abort();
    const json = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
    if (request.method() !== 'GET') { writes++; return route.fulfill({ status: 403, body: '{}' }); }
    if (p.endsWith('/auth/me')) return json(f.user);
    if (p.endsWith('/workspace')) {
      reads++; active++; maxActive = Math.max(maxActive, active);
      const response = f.workspace(state);
      try {
        if (armed) {
          const reached = armed; armed = undefined;
          const held = new Promise(resolve => { release = () => { releases.delete(releaseThis); resolve(); }; const releaseThis = release; releases.add(release); });
          reached(); await held;
        }
        if (rejectReleased) { rejectReleased = false; return await route.abort('failed'); }
        return await json(response);
      } finally { active--; }
    }
    if (p.endsWith('/idea-photo')) return route.fulfill({ status: 204 });
    if (p.endsWith('/technical-proposal')) return json(f.proposal);
    if (p.endsWith('/experience-catalog')) return json(f.catalog);
    if (p.endsWith('/experience-drafts')) return json({ technicalProposalId: f.cid, items: [] });
    if (p.endsWith('/experience-configuration')) return json({ technicalProposalId: f.cid, status: 'DRAFT', canConfirm: false,
      latestConfirmationRevision: null, confirmedAtUtc: null, confirmedByUserId: null, reviewReasons: [], blockingReasons: [], items: [] });
    if (p.endsWith(`/clients/${f.cid}`)) return json({ ...f.client, documentType: null, documentNumber: null, isActive: true, createdAtUtc: f.stamp, updatedAtUtc: f.stamp });
    if (p.endsWith(`/projects/${f.id}`)) return json({ ...f.project, description: null, client: { ...f.client, documentType: null, documentNumber: null } });
    unexpected.push(p); return route.fulfill({ status: 404, body: '{}' });
  });
  const query = () => page.getByRole('button', { name: 'Consultar estado', exact: true });
  await loadingRegression(page, {
    query, goto: async () => { await page.goto(`${origin}/projects/${f.id}?section=configuration`); await query().waitFor(); },
    arm: () => { assert.equal(armed, undefined); return new Promise(resolve => { armed = resolve; }); },
    release: () => release(), captureRelease: () => release, setState: value => { state = value; }, results,
    screenshot: name => page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true }),
    reads: () => reads, rejectOld: value => { rejectReleased = value; },
  });
  assert.equal(results.length, 4); assert.equal(writes, 0); assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
  passed = true;
} finally {
  clearTimeout(timeout);
  for (const finish of releases) finish();
  try { await browser?.close(); } finally {
    if (server.exitCode === null && server.signalCode === null) server.kill();
    await exited;
    await writeFile(path.join(output, 'server.log'), serverLog);
    await writeFile(path.join(output, 'results.json'), JSON.stringify({ passed, results, reads, writes, maxActive, errors, unexpected,
      scope: 'Real Next/React; synthetic API only; controlled barriers; maxActive may include an invalidated non-cooperative context',
      ownServerStopped: true }, null, 2));
  }
}
console.log(`Four workspace loading scenarios passed. Evidence: ${output}`);
