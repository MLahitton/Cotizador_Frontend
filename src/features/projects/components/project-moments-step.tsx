"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, List, Route } from "lucide-react";
import { useEffect, useReducer, useRef, useState, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { detailScrollTarget, initialMomentsView, journeyConnections, momentNumber, momentPlanning, momentsViewReducer, projectMoments, type MomentsViewAction, type MomentsViewState } from "../project-moments";
import styles from "./project-moments-step.module.css";

function JourneyLines({ container }: { container: HTMLDivElement | null }) {
  const [geometry, setGeometry] = useState<{ paths: string[]; width: number; height: number } | null>(null);
  useEffect(() => {
    if (!container || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = container.getBoundingClientRect();
        const markers = Array.from(container.querySelectorAll<HTMLElement>("[data-moment-marker]"));
        const anchors = markers.map((marker) => {
          const rect = marker.getBoundingClientRect();
          const card = marker.closest("button")!.getBoundingClientRect();
          return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2, bottom: card.bottom - bounds.top };
        });
        if (anchors.length !== 10 || !bounds.width) return;
        const first = anchors[0];
        const last = anchors[9];
        const desktop = Math.abs(anchors[1].y - first.y) < 2;
        const start = desktop ? `M 8 ${first.y} H ${first.x}` : `M ${first.x} 28 V ${first.y}`;
        const end = desktop ? `M ${last.x} ${last.y} H ${bounds.width - 8} V ${bounds.height - 24}` : `M ${last.x} ${last.y} V ${bounds.height - 24}`;
        setGeometry({ width: bounds.width, height: bounds.height, paths: [start, ...journeyConnections(anchors, bounds.width), end] });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    container.querySelectorAll("button").forEach((button) => observer.observe(button));
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [container]);
  return geometry ? (
    <svg className={styles.connectors} viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" focusable="false">
      <defs>
        <marker id="moments-direction" viewBox="0 0 8 8" refX="5" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M 1 1 L 6 4 L 1 7" fill="none" stroke="currentColor" /></marker>
        <marker id="moments-connection-dot" viewBox="0 0 44 8" refX="38" refY="4" markerWidth="44" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
          <circle cx="4" cy="4" r="3.5" fill="#486e98" />
        </marker>
      </defs>
      {geometry.paths.map((path, index) => <path key={index} d={path} fill="none" stroke="currentColor" strokeWidth="1.25"
        markerEnd={index > 0 && index < geometry.paths.length - 1 ? "url(#moments-connection-dot)" : "url(#moments-direction)"} />)}
    </svg>
  ) : null;
}

export function ProjectMomentsStep() {
  const [view, dispatch] = useReducer(momentsViewReducer, initialMomentsView);
  const [journey, setJourney] = useState<HTMLDivElement | null>(null);
  const detail = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), []);
  useEffect(() => {
    if (!journey || typeof IntersectionObserver === "undefined") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!reducedMotion.matches && typeof entry.target.animate === "function") {
          // Keep the measured marker position stable while the contents enter.
          entry.target.querySelectorAll("[data-moment-appearance]").forEach((content) => {
            animations.push(content.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 320, easing: "ease-out" }));
          });
          const marker = entry.target.querySelector("[data-moment-marker]");
          if (marker) animations.push(marker.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320 }));
        }
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12 });
    journey.querySelectorAll("li").forEach((node) => observer.observe(node));
    const stopAnimation = () => { if (reducedMotion.matches) animations.forEach((animation) => animation.cancel()); };
    reducedMotion.addEventListener("change", stopAnimation);
    return () => { observer.disconnect(); animations.forEach((animation) => animation.cancel()); reducedMotion.removeEventListener("change", stopAnimation); };
  }, [journey, view.list]);

  function explore(action: MomentsViewAction) {
    dispatch(action);
    cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = requestAnimationFrame(() => {
      const bounds = detail.current?.getBoundingClientRect();
      if (!bounds) return;
      const header = document.querySelector("header")?.getBoundingClientRect();
      const top = detailScrollTarget(bounds.top, bounds.bottom, window.innerHeight, header?.bottom ?? 0, window.scrollY);
      if (top !== null) window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  }

  return <ProjectMomentsView view={view} onExplore={explore} onToggle={() => dispatch({ type: "toggleView" })} journey={journey} onJourney={setJourney} detailRef={detail} />;
}

export function ProjectMomentsView({ view, onExplore, onToggle, journey = null, onJourney, detailRef }: {
  view: MomentsViewState;
  onExplore: (action: MomentsViewAction) => void;
  onToggle: () => void;
  journey?: HTMLDivElement | null;
  onJourney?: Ref<HTMLDivElement>;
  detailRef?: Ref<HTMLDivElement>;
}) {
  const selected = projectMoments[view.selected];
  const Icon = selected.Icon;
  return (
    <section aria-labelledby="project-moments-title" className={styles.moments}>
      <div className={styles.heading}>
        <div>
          <h2 id="project-moments-title" className="text-2xl font-semibold text-foreground">El recorrido de tu proyecto</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">Conoce cada etapa que acompañará tu proyecto desde la aprobación hasta la entrega.</p>
          <p className="mt-1 text-xs text-foreground-secondary">Recorrido de referencia; no muestra el avance actual.</p>
        </div>
        <Button type="button" size="sm" variant="outline" aria-controls="project-moments-journey" onClick={onToggle}>
          {view.list ? <Route size={17} aria-hidden="true" /> : <List size={17} aria-hidden="true" />}
          {view.list ? "Ver recorrido de momentos" : "Ver lista de momentos"}
        </Button>
      </div>

      <div id="project-moments-journey" ref={onJourney} className={`${styles.journey} ${view.list ? styles.list : ""}`}>
        {!view.list ? <>
          <span className={styles.start}>Inicio</span>
          <JourneyLines container={journey} />
          <span className={styles.end}>Entrega</span>
        </> : null}
        <ol className={styles.stages} aria-label={view.list ? "Lista de momentos" : "Recorrido del proyecto"}>
          {projectMoments.map((moment, index) => (
            <li key={moment.title}>
              <button type="button" className={styles.stage} aria-pressed={view.selected === index} aria-controls="project-moment-detail" onClick={() => onExplore({ type: "select", index })}>
                <span data-moment-marker className={styles.number}>{momentNumber(index)}</span>
                <span data-moment-appearance className={styles.stageIcon}><moment.Icon size={23} strokeWidth={1.65} aria-hidden="true" /></span>
                <span data-moment-appearance className={styles.stageCopy}><span className={styles.stageTitle}>{moment.title}</span><span className={styles.subtitle}>{moment.subtitle}</span></span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <Surface id="project-moment-detail" ref={detailRef} className={styles.detail}>
        <div className={styles.description}>
          <div className={styles.detailNavigation}>
            <span className={styles.counter}>Momento {momentNumber(view.selected)} de 10</span>
            <Button type="button" variant="ghost" size="sm" aria-label="Momento anterior" disabled={view.selected === 0} onClick={() => onExplore({ type: "previous" })}><ChevronLeft size={18} aria-hidden="true" /></Button>
            <Button type="button" variant="ghost" size="sm" aria-label="Momento siguiente" disabled={view.selected === 9} onClick={() => onExplore({ type: "next" })}><ChevronRight size={18} aria-hidden="true" /></Button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            <div key={view.selected} className={styles.detailTitle}>
              <span className={styles.selectedIcon}><Icon size={30} strokeWidth={1.6} aria-hidden="true" /></span>
              <div>
                <h3 className="text-xl font-semibold text-foreground sm:text-2xl">{selected.title}</h3>
                <p className="mt-1 text-sm leading-6 text-foreground-secondary">{selected.subtitle}</p>
                <p className="mt-3 text-sm leading-6 text-foreground-secondary">{selected.description}</p>
              </div>
            </div>
          </div>
        </div>
        <aside className={styles.planning} aria-label="Planificación del momento seleccionado">
          <div className={styles.planningCard}><CalendarDays size={24} aria-hidden="true" /><div><h4>Tu fecha requerida</h4><p>{momentPlanning.date}</p><span>{momentPlanning.dateExplanation}</span></div></div>
          <div className={styles.planningCard}><Clock3 size={24} aria-hidden="true" /><div><h4>Duración estimada</h4><p>{momentPlanning.duration}</p><span>{momentPlanning.durationExplanation}</span></div></div>
        </aside>
      </Surface>
    </section>
  );
}
