import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import * as f from './fixtures/workspace-loading.mjs';

const output = path.join(tmpdir(), 'sng-commercial-data-browser', String(Date.now()));
await mkdir(output, { recursive: true });
const reservation = net.createServer().listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
  { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
const exited = once(server, 'exit');
const gate = () => { let release, reach; return { pending: new Promise(r => { release = r; }), reached: new Promise(r => { reach = r; }), release: () => release(), reach: () => reach() }; };
let log = '', browser, passed = false, reads = 0, writes = 0, held, failNext = false, readOnly = false;
const errors = [], unexpected = [], gates = [];
const proposal = structuredClone(f.proposal);
proposal.items.push({ ...structuredClone(proposal.items[0]), itemId: 'item-2', reference: 'V-02', effectiveLocation: 'Otro elemento' });
proposal.itemCount = 2;
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server readiness timeout')), 60000);
    const collect = data => { log += data; if (/Ready in/.test(log)) { clearTimeout(timeout); resolve(); } };
    server.stdout.on('data', collect); server.stderr.on('data', collect); server.on('error', reject);
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.addInitScript(() => sessionStorage.setItem('sng.auth.access_token', 'synthetic-commercial-token'));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), p = url.pathname;
    if (!p.startsWith('/api/')) return url.origin === origin ? route.continue() : route.abort();
    const json = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
    if (request.method() === 'PUT' && /\/(location|physical-data)$/.test(p)) {
      writes++;
      const item = proposal.items.find(x => x.itemId === p.split('/').at(-2));
      assert.ok(item);
      const body = request.postDataJSON();
      if (held) { const own = held; held = null; own.reach(); await own.pending; }
      if (failNext) { failNext = false; return route.fulfill({ status: 503, body: '{}' }); }
      if (p.endsWith('/location')) {
        item.manualLocationOverride = body.location; item.effectiveLocation = body.location ?? item.extractedLocation;
        return json({ technicalProposalId: f.cid, itemId: item.itemId, extractedLocation: item.extractedLocation,
          manualLocationOverride: item.manualLocationOverride, effectiveLocation: item.effectiveLocation });
      }
      item.effectiveQuantity = body.quantity ?? item.effectiveQuantity;
      item.effectiveWidthMm = body.widthMm ?? item.effectiveWidthMm;
      item.effectiveHeightMm = body.heightMm ?? item.effectiveHeightMm;
      return json({ technicalProposalId: f.cid, itemId: item.itemId, quantity: item.effectiveQuantity,
        widthMm: item.effectiveWidthMm, heightMm: item.effectiveHeightMm, quantitySource: 'MANUAL',
        quantityExtractionStatus: null, quantityExtractionConfidence: null, commercialRevision: writes, dataCompleteness: item.dataCompleteness });
    }
    if (request.method() !== 'GET') { unexpected.push(request.method() + ' ' + p); return route.abort(); }
    reads++;
    if (p.endsWith('/auth/me')) return json(readOnly ? { ...f.user, role: 'ADMIN' } : f.user);
    if (p.endsWith(`/projects/${f.id}`)) return json({ ...f.project, description: null, client: { ...f.client, documentType: null, documentNumber: null } });
    if (p.endsWith(`/clients/${f.cid}`)) return json({ ...f.client, documentType: null, documentNumber: null, isActive: true, createdAtUtc: f.stamp, updatedAtUtc: f.stamp });
    if (p.endsWith('/workspace')) return json(f.workspace('Succeeded'));
    if (p.endsWith('/technical-proposal')) return json(proposal);
    if (p.endsWith('/experience-catalog')) return json(f.catalog);
    if (p.endsWith('/experience-drafts')) return json({ technicalProposalId: f.cid, items: [] });
    if (p.endsWith('/experience-level2') || p.endsWith('/experience-configuration')) return route.fulfill({ status: 503, body: '{}' });
    if (p.endsWith('/idea-photo')) return route.fulfill({ status: 204 });
    unexpected.push(p); return route.fulfill({ status: 404, body: '{}' });
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${origin}/projects/${f.id}/items/item-1`);
  const section = page.locator('.\\@container').filter({ has: page.getByRole('heading', { name: 'Datos comerciales', exact: true }) });
  const edit = section.getByRole('button', { name: 'Editar', exact: true });
  await edit.waitFor();
  assert.equal(await section.locator('input[readonly]').count(), 4);
  assert.equal(await section.getByRole('button', { name: /Guardar/ }).count(), 0);
  const geometry = () => section.locator('input').evaluateAll(inputs => inputs.map(input => {
    const box = input.getBoundingClientRect();
    return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height,
      opacity: getComputedStyle(input).opacity, disabled: input.disabled };
  }));
  const layouts = [];
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await section.scrollIntoViewIfNeeded();
    const before = await geometry();
    await section.screenshot({ path: path.join(output, `layout-${viewport.width}-read.png`) });
    await edit.click();
    assert.equal(await section.locator('input[readonly]').count(), 0);
    assert.deepEqual(await geometry(), before);
    await section.screenshot({ path: path.join(output, `layout-${viewport.width}-edit.png`) });
    await section.getByRole('textbox').fill('Edicion local para cancelar');
    assert.deepEqual(await geometry(), before);
    await section.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.deepEqual(await geometry(), before);
    assert.equal(await section.locator('input[readonly]').count(), 4);
    assert.equal(await section.getByRole('textbox').inputValue(), 'Sala de prueba');
    assert.ok(await section.evaluate(el => el.scrollWidth <= el.clientWidth));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(before.every(box => box.opacity === '1' && !box.disabled));
    await section.screenshot({ path: path.join(output, `layout-${viewport.width}-cancel.png`) });
    layouts.push({ viewport, fields: before, unchanged: true });
  }
  await writeFile(path.join(output, 'layouts.json'), JSON.stringify(layouts, null, 2));
  assert.equal(writes, 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await edit.click();
  const location = section.getByRole('textbox');
  const width = section.getByRole('spinbutton', { name: 'Ancho mm' });
  assert.equal(await location.inputValue(), 'Sala de prueba');
  assert.equal(await section.getByText('Cambios sin guardar', { exact: true }).count(), 0);
  await location.fill('Local no guardado');
  await section.getByText('Cambios sin guardar', { exact: true }).waitFor();
  await location.fill('Sala de prueba');
  assert.equal(await section.getByText('Cambios sin guardar', { exact: true }).count(), 0);
  await width.fill('1900');
  await section.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await edit.waitFor(); assert.equal(writes, 0);
  await edit.click(); assert.equal(await width.inputValue(), '1200');
  await location.fill('Ubicación guardada'); await width.fill('1600');
  held = gate(); const first = held; gates.push(first);
  await section.getByRole('button', { name: 'Guardar ubicación', exact: true }).dblclick();
  await first.reached; assert.equal(writes, 1);
  assert.equal(await section.getByRole('button', { name: 'Guardar ubicación', exact: true }).isDisabled(), true);
  first.release();
  await section.getByRole('button', { name: 'Cancelar', exact: true }).waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('input[placeholder="Sala principal"]')?.value === 'Ubicación guardada' &&
    [...document.querySelectorAll('button')].some(b => b.textContent === 'Cancelar' && !b.disabled));
  assert.equal(await width.inputValue(), '1600');
  await section.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await edit.waitFor(); assert.equal(await location.inputValue(), 'Ubicación guardada');
  await edit.click(); assert.equal(await width.inputValue(), '1200');
  await width.fill('1700'); failNext = true;
  await section.getByRole('button', { name: 'Guardar medidas', exact: true }).click();
  await section.getByText('No fue posible actualizar las medidas del elemento.').waitFor();
  assert.equal(await width.inputValue(), '1700');
  await page.screenshot({ path: path.join(output, 'error-preserves-form.png'), fullPage: true });
  // Save dimensions while another independent group remains locally changed.
  await location.fill('Pendiente después de medidas');
  await section.getByRole('button', { name: 'Guardar medidas', exact: true }).click();
  await page.waitForResponse(r => r.url().endsWith('/technical-proposal') && r.request().method() === 'GET');
  await location.waitFor();
  assert.equal(await location.inputValue(), 'Pendiente después de medidas');
  assert.equal(await width.inputValue(), '1700');
  await section.getByRole('button', { name: 'Guardar ubicación', exact: true }).click();
  await edit.waitFor(); assert.equal(await section.locator('input[readonly]').count(), 4);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(output, 'read-mobile.png'), fullPage: true });
  assert.ok(await section.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  // A retained write may commit, but must not change another item's section.
  await edit.click(); await location.fill('Antigua respuesta');
  held = gate(); const old = held; gates.push(old);
  await section.getByRole('button', { name: 'Guardar ubicación', exact: true }).click();
  await old.reached;
  await page.getByRole('link', { name: /Volver a Configuracion/ }).click();
  await page.getByRole('button', { name: /Abrir detalle de V-02/ }).click();
  await page.waitForFunction(() => document.querySelector('input[placeholder="Sala principal"]')?.value === 'Otro elemento');
  const oldResponse = page.waitForResponse(r => r.url().endsWith('/items/item-1/location'));
  old.release(); await oldResponse;
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  assert.equal(await location.inputValue(), 'Otro elemento');
  assert.equal(await section.locator('input[readonly]').count(), 4);
  readOnly = true;
  await page.reload();
  await section.getByRole('heading', { name: 'Datos comerciales', exact: true }).waitFor();
  assert.equal(await edit.count(), 0);
  assert.equal(await section.locator('input[readonly]').count(), 4);
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
  passed = true;
} finally {
  for (const g of gates) g.release();
  await browser?.close();
  if (server.exitCode === null) server.kill();
  await exited;
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ passed, reads, mockedWrites: writes, errors, unexpected, ownServerStopped: true }, null, 2));
  await writeFile(path.join(output, 'server.log'), log);
  console.log(output);
}
