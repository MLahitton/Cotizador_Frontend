import assert from 'node:assert/strict';

// Run against real Next/React with the caller's isolated, GET-only API fixture.
export default async function loadingRegression(page, fixture) {
  const { query, goto, arm, release, setState, results, screenshot } = fixture;
  await page.addInitScript(() => {
    const original = window.fetch;
    window.loadingProbe = { requests: [], ignoreNextAbort: false };
    window.fetch = function (input, init) {
      if (!String(input).includes('/workspace')) return original(input, init);
      const probe = window.loadingProbe;
      const record = { aborted: false, settled: false };
      probe.requests.push(record);
      init?.signal?.addEventListener('abort', () => { record.aborted = true; });
      const ignore = probe.ignoreNextAbort; probe.ignoreNextAbort = false;
      return original(input, ignore ? { ...init, signal: undefined } : init)
        .finally(() => { record.settled = true; });
    };
  });
  setState('Running'); await goto(); setState('Succeeded');
  const held = arm(); await query().click(); await held;
  await page.evaluate(() => sessionStorage.setItem('sng.auth.access_token', 'new-context'));
  await page.getByRole('button', { name: 'Editar proyecto', exact: true }).click();
  await page.locator('input[name="name"]').fill('Edicion local durante consulta');
  // The signal is aborted by effect cleanup, not by an elapsed delay.
  await page.waitForFunction(() => window.loadingProbe.requests.at(-1).aborted);
  release();
  await page.waitForFunction(() => window.loadingProbe.requests.at(-1).settled);
  await screenshot('cleanup-before-response');
  assert.equal(await page.getByText('V-01', { exact: true }).count(), 0);
  await query().waitFor({ state: 'visible' });
  assert.equal(await query().isEnabled(), true, 'new context must not inherit disposed loading');
  results.push({ case: 'cleanup-before-response', passed: true });

  // Completing before a token-triggered render is the other legal ordering.
  setState('Succeeded'); await goto();
  const first = arm(); await query().click(); await first; release();
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Consultar estado' && !b.disabled));
  await page.evaluate(() => sessionStorage.setItem('sng.auth.access_token', 'after-resolution'));
  await page.getByRole('button', { name: 'Editar proyecto', exact: true }).click();
  await page.waitForFunction(() => window.loadingProbe.requests.at(-1).aborted);
  assert.equal(await query().isEnabled(), true);
  results.push({ case: 'response-before-cleanup', passed: true });

  for (const reject of [false, true]) {
    setState('Succeeded'); await goto();
    await page.getByText('V-01', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Alta', exact: true }).click();
    // Deliberately non-cooperative transport: old completion can occur AFTER a new read starts.
    await page.evaluate(() => { window.loadingProbe.ignoreNextAbort = true; });
    setState('Failed'); const old = arm(); await query().click(); await old;
    const releaseOld = fixture.captureRelease();
    await page.evaluate(() => sessionStorage.setItem('sng.auth.access_token', 'owner-new'));
    await page.getByRole('button', { name: 'Editar proyecto', exact: true }).click();
    await page.waitForFunction(() => window.loadingProbe.requests.at(-1).aborted);
    assert.equal(await query().isEnabled(), true);
    setState('Succeeded'); const newer = arm(); const beforeNew = fixture.reads();
    await query().evaluate(button => { button.click(); button.click(); }); await newer;
    assert.equal(fixture.reads(), beforeNew + 1);
    const releaseNew = fixture.captureRelease();
    const before = fixture.reads();
    fixture.rejectOld(reject); releaseOld();
    await page.waitForFunction(() => window.loadingProbe.requests.at(-2).settled);
    assert.equal(await query().isDisabled(), true, 'old completion must not clear the new loading');
    assert.equal(fixture.reads(), before);
    assert.equal(await page.getByText('V-01', { exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Alta', exact: true }).getAttribute('aria-pressed'), 'true');
    releaseNew();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Consultar estado' && !b.disabled));
    assert.equal(await page.getByRole('button', { name: 'Alta', exact: true }).getAttribute('aria-pressed'), 'true');
    await screenshot(reject ? 'late-rejection-new-owner' : 'late-response-new-owner');
    results.push({ case: reject ? 'late-rejection-new-pending' : 'late-response-new-pending', passed: true });
  }
};
