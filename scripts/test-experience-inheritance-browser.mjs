import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import * as f from './fixtures/workspace-loading.mjs';
import { saveOwnershipScenario } from './priorities-save-ownership-browser.mjs';

const output = path.resolve(process.env.WORKSPACE_BROWSER_OUTPUT || path.join(tmpdir(), 'sng-item-preferences-browser', String(Date.now())));
await mkdir(output, { recursive: true });
const reservation = net.createServer().listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
  { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
const exited = once(server, 'exit');
let log = '', browser, passed = false, writes = 0, reads = 0, release = () => {};
const errors = [], unexpected = [];
const initial = id => ({ technicalProposalItemId: id, catalogVersion: '1', spaceTypeCode: null, resolutionState: 'PENDING', revision: 0,
  updatedAtUtc: null, updatedByUserId: null, level1Resolution: null, answers: [{ benefitCode: 'benefit', optionCode: 'HIGH' }],
  hasSavedDraft: false, preferenceOrigin: 'EXPERIENCE' });
const drafts = { 'item-1': initial('item-1'), 'item-2': initial('item-2') };
const ownership = process.argv.includes('--save-ownership') ? saveOwnershipScenario(drafts, f.stamp, f.id) : null;
const proposal = { ...f.proposal, itemCount: 2, detectedItemCount: 2, totalProposalItemCount: 2,
  items: [f.proposal.items[0], { ...f.proposal.items[0], itemId: 'item-2', reference: 'V-02', sequence: 2 }] };
let holdWrite, reachedWrite, configurationFailure = true;
let holdResolution, reachedResolution, releaseResolution = () => {};
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Own server readiness timeout')), 60000);
    const collect = data => { log += data; if (/Ready in/.test(log)) { clearTimeout(timeout); resolve(); } };
    server.stdout.on('data', collect); server.stderr.on('data', collect); server.on('error', reject);
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.addInitScript(() => sessionStorage.setItem('sng.auth.access_token', 'synthetic-fixture-token'));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), p = url.pathname;
    if (!p.startsWith('/api/')) return url.origin === origin ? route.continue() : route.abort();
    const json = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
    if (request.method() === 'PUT' && p.endsWith('/experience-draft')) {
      writes++;
      const id = p.split('/').at(-2), body = request.postDataJSON();
      if (ownership) return ownership.write(route, id, body, json);
      assert.ok(drafts[id]); assert.equal(body.expectedRevision, drafts[id].revision);
      if (holdWrite) { const held = holdWrite; holdWrite = null; reachedWrite(); await held; }
      drafts[id] = { ...drafts[id], answers: body.answers, revision: drafts[id].revision + 1, hasSavedDraft: true,
        preferenceOrigin: 'SAVED', updatedAtUtc: f.stamp, updatedByUserId: f.id };
      return json(drafts[id]);
    }
    if (request.method() !== 'GET') { unexpected.push(request.method() + ' ' + p); return route.abort(); }
    reads++;
    if (p.endsWith('/auth/me')) return json(f.user);
    if (p.endsWith('/workspace')) return json(f.workspace('Succeeded'));
    if (p.endsWith('/idea-photo')) return route.fulfill({ status: 204 });
    if (p.endsWith('/technical-proposal')) return json(proposal);
    if (p.endsWith('/experience-catalog')) return json(f.catalog);
    if (p.endsWith('/experience-drafts')) return json({ technicalProposalId: f.cid, items: Object.values(drafts) });
    if (p.endsWith('/experience-configuration')) {
      if (configurationFailure) return route.fulfill({ status: 503, body: '{}' });
      return json({ technicalProposalId: f.cid, status: 'DRAFT', canConfirm: false, latestConfirmationRevision: null,
        confirmedAtUtc: null, confirmedByUserId: null, reviewReasons: [], blockingReasons: [], items: [] });
    }
    if (p.endsWith('/experience-level2')) {
      const id = p.split('/').at(-2), value = drafts[id].answers[0]?.optionCode;
      if (holdResolution) { const held = holdResolution; holdResolution = null; reachedResolution(); await held; }
      const candidate = { id: f.qid, code: value, name: `Sistema ${value}`, technicalName: null, commercialName: null,
        functionalType: null, family: null, series: null, compatibilityState: 'COMPATIBLE', rank: 0, reviewReasons: [], blockingReasons: [] };
      const empty = { state: 'PENDING', suggested: null, override: null, effective: null, overrideState: 'NONE', candidates: [], reviewReasons: [], blockingReasons: [] };
      return json({ technicalProposalId: f.cid, technicalProposalItemId: id, technicalSelectionRevision: null, effectiveFunctionalType: null,
        system: { ...empty, state: 'RESOLVED', suggested: candidate, effective: candidate }, glass: { ...empty, glassFamily: null },
        finish: { state: 'PENDING_EXTERNAL_SOURCE', reviewReasons: [], blockingReasons: [] }, overallState: 'PENDING' });
    }
    if (p.endsWith(`/clients/${f.cid}`)) return json({ ...f.client, documentType: null, documentNumber: null, isActive: true, createdAtUtc: f.stamp, updatedAtUtc: f.stamp });
    if (p.endsWith(`/projects/${f.id}`)) return json({ ...f.project, description: null, client: { ...f.client, documentType: null, documentNumber: null } });
    unexpected.push(p); return route.fulfill({ status: 404, body: '{}' });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/projects/${f.id}?section=configuration`);
  const cards = page.locator('.\\@container').filter({ has: page.getByRole('button', { name: /Abrir detalle de V-/ }) });
  const first = cards.nth(0), second = cards.nth(1);
  if (ownership) {
    await ownership.run(page, first, () => writes, output, target => page.screenshot({ path: target, fullPage: true }));
    assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
  } else {
  await first.getByText('Preferencias de Experience: pendientes de aceptación.').waitFor();
  assert.equal(await second.getByRole('button', { name: 'Alta', exact: true }).getAttribute('aria-pressed'), 'true');
  holdWrite = new Promise(resolve => { release = resolve; });
  const reached = new Promise(resolve => { reachedWrite = resolve; });
  holdResolution = new Promise(resolve => { releaseResolution = resolve; });
  const resolutionReached = new Promise(resolve => { reachedResolution = resolve; });
  await first.getByRole('button', { name: 'Guardar prioridades', exact: true }).click();
  await reached;
  assert.equal(await first.getByRole('button', { name: 'Guardando', exact: false }).isDisabled(), true);
  assert.equal(writes, 1);
  release();
  await resolutionReached;
  await first.getByText('Consultando sistema y vidrio...').waitFor();
  await first.getByRole('button', { name: 'Media', exact: true }).click();
  assert.equal(await first.getByText(/Sistema: Sistema HIGH/).count(), 0);
  await first.getByRole('button', { name: 'Guardar prioridades', exact: true }).click();
  await first.getByText(/Sistema: Sistema MEDIUM/).waitFor();
  const oldResolution = page.waitForResponse(async response => response.url().endsWith('/experience-level2') &&
    (await response.json()).system.effective.name === 'Sistema HIGH');
  releaseResolution();
  await oldResolution;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await first.getByText(/Sistema: Sistema HIGH/).count(), 0);
  assert.equal(await first.getByText(/Sistema: Sistema MEDIUM/).count(), 1);
  assert.equal(second ? drafts['item-2'].revision : -1, 0);
  await first.getByRole('button', { name: 'Baja', exact: true }).click();
  configurationFailure = false;
  const refreshConfiguration = page.getByRole('region').getByRole('button', { name: 'Consultar estado', exact: true });
  await refreshConfiguration.click();
  await refreshConfiguration.waitFor({ state: 'hidden' });
  assert.equal(await first.getByRole('button', { name: 'Baja', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(writes, 2);
  const refreshedDrafts = page.waitForResponse(response => response.url().endsWith('/experience-drafts'));
  await page.evaluate(() => sessionStorage.setItem('sng.auth.access_token', 'synthetic-new-context'));
  await page.getByRole('button', { name: 'Editar proyecto', exact: true }).click();
  await refreshedDrafts;
  assert.equal(await first.getByRole('button', { name: 'Baja', exact: true }).getAttribute('aria-pressed'), 'true');
  await second.getByRole('button', { name: 'Media', exact: true }).click();
  assert.equal(await first.getByRole('button', { name: 'Baja', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: path.join(output, 'local-draft-preserved.png'), fullPage: true });
  await page.reload();
  await first.getByText('Configuración guardada', { exact: true }).waitFor();
  assert.equal(await first.getByRole('button', { name: 'Media', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await second.getByRole('button', { name: 'Alta', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: path.join(output, 'individual-persistence.png'), fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, []); assert.equal(writes, 2);
  }
  passed = true;
} finally {
  ownership?.dispose();
  release(); releaseResolution(); await browser?.close();
  if (server.exitCode === null) server.kill();
  await exited;
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ passed, reads, mockedWrites: writes, errors, unexpected,
    scope: 'React real, synthetic API; no real product writes', ownServerStopped: true }, null, 2));
  await writeFile(path.join(output, 'server.log'), log);
}
