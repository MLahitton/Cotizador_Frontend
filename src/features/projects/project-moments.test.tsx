import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectMomentsView } from "./components/project-moments-step";
import { detailScrollTarget, initialMomentsView, journeyConnections, momentNumber, momentsViewReducer, projectMoments, type MomentsViewState } from "./project-moments";

const render = (view: MomentsViewState) => renderToStaticMarkup(createElement(ProjectMomentsView, { view, onExplore() {}, onToggle() {} }));

test("the ten approved moments retain their order and start at 01 without claiming progress", () => {
  assert.deepEqual(projectMoments.map((moment) => moment.title), ["Legalización del proyecto", "Asignación del equipo", "Programación de toma de medidas", "Toma de medidas", "Acta de vanos", "Producción", "Despacho", "Instalación", "Acta de entrega", "Postventa"]);
  const html = render(initialMomentsView);
  assert.ok(html.includes("Momento 01 de 10"));
  assert.ok(html.includes("no muestra el avance actual"));
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  const nodes = html.slice(html.indexOf("<ol"), html.indexOf("</ol>"));
  let previous = -1;
  for (const moment of projectMoments) { const index = nodes.indexOf(moment.title); assert.ok(index > previous); previous = index; }
});

test("each selection synchronizes the numbered moment, detail title, subtitle and accessible button", () => {
  let state = initialMomentsView;
  for (let index = 9; index >= 0; index--) {
    state = momentsViewReducer(state, { type: "select", index });
    const html = render(state);
    const detail = html.slice(html.indexOf('id="project-moment-detail"'));
    assert.ok(detail.includes(`Momento ${momentNumber(index)} de 10`));
    assert.ok(detail.includes(projectMoments[index].title));
    assert.ok(detail.includes(projectMoments[index].subtitle));
    assert.ok(detail.includes(projectMoments[index].description));
    const journey = html.slice(html.indexOf("<ol"), html.indexOf("</ol>"));
    assert.ok(journey.includes(projectMoments[index].subtitle));
    for (const [otherIndex, moment] of projectMoments.entries()) {
      assert.ok(!journey.includes(moment.description));
      if (otherIndex !== index) assert.ok(!detail.includes(moment.description));
    }
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.equal((html.match(/aria-controls="project-moment-detail"/g) ?? []).length, 10);
  }
});

test("previous and next stop at the endpoints and never wrap; invalid selections are ignored", () => {
  let state = momentsViewReducer(initialMomentsView, { type: "previous" });
  assert.equal(state.selected, 0);
  assert.match(render(state), /aria-label="Momento anterior"[^>]*disabled=""/);
  for (let index = 1; index <= 9; index++) { state = momentsViewReducer(state, { type: "next" }); assert.equal(state.selected, index); }
  assert.equal(momentsViewReducer(state, { type: "next" }).selected, 9);
  assert.match(render(state), /aria-label="Momento siguiente"[^>]*disabled=""/);
  for (const index of [-1, 10, 1.5, Number.NaN]) assert.equal(momentsViewReducer(state, { type: "select", index }), state);
  for (let index = 8; index >= 0; index--) { state = momentsViewReducer(state, { type: "previous" }); assert.equal(state.selected, index); }
});

test("list and journey views preserve the selected content and all ten moments", () => {
  let state = momentsViewReducer(initialMomentsView, { type: "select", index: 5 });
  for (const list of [true, false]) {
    state = momentsViewReducer(state, { type: "toggleView" });
    assert.equal(state.list, list);
    assert.equal(state.selected, 5);
    const html = render(state);
    assert.ok(html.includes(list ? "Ver recorrido de momentos" : "Ver lista de momentos"));
    assert.ok(html.includes("Momento 06 de 10"));
    for (const moment of projectMoments) assert.ok(html.includes(moment.title));
  }
});

test("absent per-moment planning remains undefined rather than using fabricated dates or durations", () => {
  for (let selected = 0; selected < 10; selected++) {
    const html = render({ selected, list: false });
    assert.equal((html.match(/Por definir/g) ?? []).length, 2);
    assert.ok(!html.includes("datetime="));
    assert.ok(!html.includes("¿Qué sucede en este momento?"));
    assert.ok(!html.includes("<form"));
  }
});

test("connections link every consecutive node in aligned five-column rows, with a 05 to 06 loop", () => {
  const anchors = Array.from({ length: 10 }, (_, i) => ({ x: 40 + (i % 5) * 190, y: i < 5 ? 50 : 280, bottom: i < 5 ? 210 : 440 }));
  const paths = journeyConnections(anchors, 1000);
  assert.equal(paths.length, 9);
  paths.forEach((path, i) => assert.ok(path.startsWith(`M ${anchors[i].x} ${anchors[i].y}`)));
  assert.ok(paths[4].endsWith(`H ${anchors[5].x}`));
  assert.ok(paths[4].includes("C"));
  assert.notEqual(paths[4], `M ${anchors[4].x} ${anchors[4].y} V ${anchors[9].y}`);
  const tallerFifth = anchors.map((anchor, index) => index === 4 ? { ...anchor, bottom: 240 } : anchor);
  const curvedReturn = journeyConnections(tallerFifth, 1000)[4];
  assert.ok(curvedReturn.includes("992 260")); // Midway between card 05's bottom (240) and row 06 (280).
  assert.ok(curvedReturn.endsWith(`H ${anchors[5].x}`));
  paths.forEach((path, index) => {
    if (index !== 4) assert.equal(path, `M ${anchors[index].x} ${anchors[index].y} H ${anchors[index + 1].x}`);
  });
  const vertical = anchors.map((anchor, index) => ({ ...anchor, x: 24, y: 60 + index * 120 }));
  journeyConnections(vertical, 360).forEach((path, i) => assert.equal(path, `M 24 ${vertical[i].y} V ${vertical[i + 1].y}`));
});

test("detail scrolling is unnecessary when visible, minimal when below, and clears the sticky header", () => {
  assert.equal(detailScrollTarget(100, 600, 800, 72, 300), null);
  assert.equal(detailScrollTarget(600, 900, 800, 72, 300), 416);
  assert.equal(detailScrollTarget(30, 500, 800, 72, 300), 242);
  assert.equal(detailScrollTarget(900, 2000, 800, 72, 300), 1112);
});
