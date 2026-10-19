import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Project } from "../data/projects";
import { projectDestination, projectMedia, projectPlatform, type ProjectMedia } from "../data/showcase";
import { ProjectVisual } from "./ProjectVisual";

const Illustration = memo(function Illustration({ project, item }: { project: Project; item: Extract<ProjectMedia, { kind: "illustration" }> }) {
  const frame = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = frame.current, visual = content.current;
    if (!box || !visual) return;
    const fit = () => {
      const style = getComputedStyle(box);
      const width = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (width <= 0 || height <= 0 || !visual.scrollWidth || !visual.scrollHeight) return;
      visual.style.setProperty("--illustration-scale", String(Math.min(1, width / visual.scrollWidth, height / visual.scrollHeight)));
    };
    const resize = new ResizeObserver(fit);
    resize.observe(box); resize.observe(visual); fit();
    return () => resize.disconnect();
  }, []);
  return <div className={`showcase-illustration${project.visual === "website" ? " showcase-illustration-website" : ""}`} ref={frame} aria-hidden="true"><div className="showcase-illustration-content" ref={content}><ProjectVisual project={project} scene={item.scene} /></div></div>;
});

const Media = memo(function Media({ item, project, active, expanded, failed, onError }: {
  item: ProjectMedia; project: Project; active: boolean; expanded: boolean; failed: boolean; onError: (id: string) => void;
}) {
  if (failed) return <div className="showcase-fallback"><span>PREVIEW OFFLINE</span><p>This scene could not load. Its description is below, and the other scenes are still available.</p></div>;
  if (item.kind === "illustration") return <Illustration project={project} item={item} />;
  if (item.kind === "video" && active && expanded) return <video controls playsInline muted preload="none" poster={item.poster} onError={() => onError(item.id)}><source src={item.src} /><track kind="captions" src={item.captions} srcLang="en" label="English" default /></video>;
  return <div className="showcase-image-scroll"><img src={item.kind === "image" ? item.src : item.poster} alt={expanded && item.kind === "image" ? item.alt : ""} loading={active ? "eager" : "lazy"} decoding="async" draggable={false} onError={() => onError(item.id)} /></div>;
});

export function ProjectShowcase({ project, initialIndex = 0, expanded = false, onExpand }: {
  project: Project; initialIndex?: number; expanded?: boolean; onExpand?: (index: number) => void;
}) {
  const items = projectMedia(project);
  const [index, setIndex] = useState(Math.min(initialIndex, items.length - 1));
  const [inspect, setInspect] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const track = useRef<HTMLDivElement>(null), filmstrip = useRef<HTMLDivElement>(null);
  const current = useRef(index), settle = useRef<number | undefined>(undefined);
  const transition = useRef<Animation | null>(null);
  const fail = useCallback((id: string) => setFailed(previous => previous.has(id) ? previous : new Set([...previous, id])), []);
  const item = items[index];
  const number = (n: number) => String(n + 1).padStart(2, "0");
  function select(next: number) {
    const bounded = Math.max(0, Math.min(items.length - 1, next));
    const changed = bounded !== current.current;
    window.clearTimeout(settle.current);
    transition.current?.cancel();
    current.current = bounded;
    setIndex(bounded);
    setInspect(false);
    const node = track.current;
    if (!node) return;
    // Controls go straight to the requested scene; finger swipes keep native snapping.
    // A short opacity transition avoids rasterizing every intermediate screenshot.
    node.scrollTo({ left: bounded * node.clientWidth, behavior: "instant" });
    if (changed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      transition.current = node.children[bounded]?.animate([{ opacity: .65 }, { opacity: 1 }], { duration: 140, easing: "ease-out" }) ?? null;
    }
  }
  useLayoutEffect(() => {
    const node = track.current;
    if (!node) return;
    let width = node.clientWidth;
    const resize = new ResizeObserver(() => {
      if (node.clientWidth === width) return;
      width = node.clientWidth;
      node.scrollTo({ left: current.current * width, behavior: "auto" });
    });
    node.scrollLeft = current.current * node.clientWidth;
    resize.observe(node);
    return () => resize.disconnect();
  }, []);
  useEffect(() => {
    const rail = filmstrip.current, button = rail?.children[index] as HTMLElement | undefined;
    if (rail && button) rail.scrollTo({ left: button.offsetLeft - (rail.clientWidth - button.clientWidth) / 2, behavior: "auto" });
  }, [index]);
  useEffect(() => () => { window.clearTimeout(settle.current); transition.current?.cancel(); }, []);
  if (!item) return null;
  return (
    <section className={`project-showcase${expanded ? " expanded-showcase" : ""}${inspect ? " is-inspecting" : ""}${items.length === 1 ? " single-scene" : ""}`} aria-label={`${project.title} project gallery`} aria-roledescription="carousel"
      onTouchStart={event => event.stopPropagation()}
      onTouchEnd={event => event.stopPropagation()}
      onKeyDown={event => {
        if ((event.target as HTMLElement).closest("video, input, a") || event.altKey || event.ctrlKey || event.metaKey) return;
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowLeft" ? current.current - 1 : event.key === "ArrowRight" ? current.current + 1 : null;
        if (next === null) return;
        event.preventDefault(); event.stopPropagation(); select(next);
      }}>
      <span className="showcase-media-label">{item.label}</span>
      <div className="showcase-screen">
        <div className="showcase-track" ref={track} tabIndex={0} role="group" aria-label="Preview scenes. Swipe or use left and right arrow keys."
          onScroll={() => {
            window.clearTimeout(settle.current);
            settle.current = window.setTimeout(() => {
              const node = track.current;
              if (!node || !node.clientWidth) return;
              const next = Math.max(0, Math.min(items.length - 1, Math.round(node.scrollLeft / node.clientWidth)));
              if (next === current.current) return;
              current.current = next; setIndex(next); setInspect(false);
            }, 120);
          }}>
          {items.map((media, i) => <div className="showcase-slide" key={media.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}: ${media.title}`} aria-hidden={i !== index} inert={i !== index}>
            <Media item={media} project={project} active={i === index} expanded={expanded} failed={failed.has(media.id)} onError={fail} />
          </div>)}
        </div>
      </div>
      {(!expanded || items.length > 1 || item.kind === "image") && <div className="showcase-navigation">
        {items.length > 1 && <div className="showcase-scene-number"><span>SCENE</span><b>{number(index)}<small> / {String(items.length).padStart(2, "0")}</small></b></div>}
        <div className="showcase-arrow-controls">
          {!expanded && <button className="showcase-expand" type="button" aria-label={`Expand ${item.title} preview`} onClick={() => onExpand?.(index)}>EXPAND <span aria-hidden="true">↗</span></button>}
          {expanded && item.kind === "image" && <button type="button" className="showcase-inspect" aria-pressed={inspect} onClick={() => setInspect(value => !value)}>{inspect ? "FIT IMAGE" : "INSPECT IMAGE"}</button>}
          {items.length > 1 && <><button type="button" aria-label="Previous scene" disabled={index === 0} onClick={() => select(current.current - 1)}>←</button>
          <button type="button" aria-label="Next scene" disabled={index === items.length - 1} onClick={() => select(current.current + 1)}>→</button></>}
        </div>
      </div>}
      <div className="showcase-caption" aria-live="polite" aria-atomic="true"><h3>{item.title}</h3><p>{item.caption}</p></div>
      {items.length > 1 && <div className="showcase-filmstrip" ref={filmstrip} role="group" aria-label="Choose a project scene">
        {items.map((media, i) => <button type="button" key={media.id} title={`Scene ${i + 1}: ${media.title}`} aria-current={i === index ? "true" : undefined} onClick={() => select(i)}>
          {media.kind !== "illustration" && <img src={media.kind === "image" ? media.src : media.poster} alt="" loading="lazy" decoding="async" />}
          <span>{number(i)}</span><b>{media.title}</b>{media.kind === "video" && <small>CLIP</small>}
        </button>)}
      </div>}
      <p className="showcase-help">{items.length > 1 ? "SWIPE / ← → TO EXPLORE" : "PROJECT PREVIEW"}<span>{expanded ? "ESC TO CLOSE" : "EXPAND FOR A CLOSER LOOK"}</span></p>
    </section>
  );
}

export function ProjectViewer({ project, initialIndex, onClose }: { project: Project; initialIndex: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const destination = projectDestination(project);
  useEffect(() => {
    const node = dialog.current, previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    if (!node) return;
    node.showModal(); document.body.style.overflow = "hidden";
    return () => {
      node.close(); document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className="project-viewer" aria-labelledby="viewer-project-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="project-viewer-console">
      <header className="project-viewer-header"><div><span>SPIRIT TERMINAL // PROJECT ARCHIVE</span><h2 id="viewer-project-title">{project.title}</h2></div><button type="button" autoFocus onClick={onClose} aria-label="Close project viewer">×</button></header>
      <ProjectShowcase project={project} initialIndex={initialIndex} expanded />
      <footer className="project-viewer-footer"><span>{projectPlatform(project)}</span>{destination ? <a href={destination.href} target="_blank" rel="noopener noreferrer">{destination.label} ↗</a> : <span className="viewer-requirement">{project.visual === "afterhours" ? "DISCORD PLAYTEST PENDING" : "FULL SOCIAL EXPERIENCE REQUIRES DISCORD"}</span>}</footer>
    </div>
  </dialog>;
}
