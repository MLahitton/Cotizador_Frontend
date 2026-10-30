import assert from 'node:assert/strict';

export function saveOwnershipScenario(drafts, stamp, userId) {
  const gates = [];
  let next;
  const arm = (reject = false) => {
    let release, reached;
    const gate = { reject, wait: new Promise(r => { release = r; }), reached: new Promise(r => { reached = r; }),
      release: () => release(), signal: () => reached() };
    gates.push(gate); next = gate; return gate;
  };
  return {
    dispose: () => gates.forEach(g => g.release()),
    async write(route, id, body, json) {
      const gate = next; next = undefined;
      assert.ok(gate, 'No automatic PUT or duplicate submission');
      gate.signal(); await gate.wait;
      if (gate.reject) return route.abort('failed');
      if (body.expectedRevision !== drafts[id].revision) return route.fulfill({ status: 409,
        contentType: 'application/json', body: JSON.stringify({ code: 'REQUIREMENT_EXPERIENCE_CONFLICT', detail: 'Concurrent change' }) });
      drafts[id] = { ...drafts[id], answers: body.answers, revision: drafts[id].revision + 1,
        hasSavedDraft: true, preferenceOrigin: 'SAVED', updatedAtUtc: stamp, updatedByUserId: userId };
      return json(drafts[id]);
    },
    async run(page, first, writes, output, screenshot) {
      let token = 0;
      const changeContext = async () => {
        const read = page.waitForResponse(r => r.url().endsWith('/experience-drafts'));
        await page.evaluate(value => sessionStorage.setItem('sng.auth.access_token', value), `ownership-${++token}`);
        await page.getByRole('button', { name: 'Editar proyecto', exact: true }).click();
        await read;
        await first.getByRole('button', { name: /Guard/ }).waitFor();
      };
      const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const save = () => first.getByRole('button', { name: 'Guardar prioridades', exact: true });
      await first.getByRole('button', { name: 'Alta', exact: true }).waitFor();
      // Old success commits while a newer request is held. The newer revision must conflict.
      await first.getByRole('button', { name: 'Baja', exact: true }).click();
      const old = arm(); await save().dblclick(); await old.reached;
      const before = writes(); assert.equal(before, 1);
      await changeContext();
      assert.equal(await first.getByRole('button', { name: /Guard/ }).isEnabled(), true, 'new context must not inherit saving');
      assert.equal(await first.getByRole('button', { name: 'Baja', exact: true }).getAttribute('aria-pressed'), 'true');
      await first.getByRole('button', { name: 'Media', exact: true }).click();
      const current = arm(); await save().dblclick(); await current.reached; assert.equal(writes(), before + 1);
      const oldDone = page.waitForResponse(r => r.url().endsWith('/experience-draft') && r.status() === 200);
      old.release(); await oldDone; await settle();
      assert.equal(await first.getByRole('button', { name: /Guardando/ }).isDisabled(), true);
      assert.equal(await first.getByRole('button', { name: 'Media', exact: true }).getAttribute('aria-pressed'), 'true');
      const conflict = page.waitForResponse(r => r.url().endsWith('/experience-draft') && r.status() === 409);
      current.release(); await conflict; await settle();
      await first.getByText('Estas prioridades cambiaron. Vuelve a cargarlas antes de guardar de nuevo.').waitFor();
      assert.equal(await first.getByRole('button', { name: /Guardando/ }).count(), 0);
      assert.equal(await first.getByRole('button', { name: 'Media', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(drafts['item-1'].revision, 1);
      await screenshot(`${output}/ownership-conflict.png`);

      // Reload deliberately reads the durable revision, not an automatic PUT retry.
      await page.reload(); await first.getByRole('button', { name: 'Baja', exact: true }).waitFor();
      await first.getByRole('button', { name: 'Media', exact: true }).click();
      const rejected = arm(true); await save().click(); await rejected.reached;
      await changeContext(); assert.equal(await save().isEnabled(), true);
      await first.getByRole('button', { name: 'Alta', exact: true }).click();
      const newer = arm(); await save().dblclick(); await newer.reached;
      const failure = page.waitForEvent('requestfailed', r => r.url().endsWith('/experience-draft'));
      rejected.release(); await failure; await settle();
      assert.equal(await first.getByRole('button', { name: /Guardando/ }).isDisabled(), true);
      assert.equal(await first.getByRole('button', { name: 'Alta', exact: true }).getAttribute('aria-pressed'), 'true');
      newer.release();
      await first.getByText(/Sistema: Sistema HIGH/).waitFor();
      assert.equal(await first.getByRole('button', { name: /Guardando/ }).count(), 0);
      assert.equal(drafts['item-1'].revision, 2);
      // Successful completion before context change remains usable.
      await changeContext();
      await first.getByRole('button', { name: 'Media', exact: true }).click();
      assert.equal(await save().isEnabled(), true);
      assert.equal(writes(), 4);
      await screenshot(`${output}/ownership-complete.png`);
    },
  };
}
