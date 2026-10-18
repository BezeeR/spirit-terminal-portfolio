import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { AmbientAudio, AmbientAudioPanel, AmbientAudioProvider } from "./components/AmbientAudio";
import { BroadcastAtmosphere } from "./components/BroadcastAtmosphere";
import { ProjectShowcase, ProjectViewer } from "./components/ProjectShowcase";
import { PortfolioArrival } from "./components/WelcomeIntro";
import { projects } from "./data/projects";
import { projectDestination, projectPlatform } from "./data/showcase";
import "./styles.css";
import "./components/project-showcase.css";

const GITHUB_URL = "https://github.com/BezeeR";
const DISCORD_URL = "https://discord.com/users/171078389166243840";
const DISCORD_USERNAME = "bezeer";
const DISCORD_USER_ID = "171078389166243840";
const PROJECT_ACCENTS = ["#00A8FF", "#5E1174", "#FFCC00", "#FF66B2", "#57D7DC", "#8B5CF6", "#19B6B2", "#6CE5C5"];

function projectFromHash() {
  const index = projects.findIndex((project) => `#${project.id}` === window.location.hash);
  return index < 0 ? 0 : index;
}

function App() {
  const [activeIndex, setActiveIndex] = useState(projectFromHash);
  const [detailMode, setDetailMode] = useState<"features" | "stack">("features");
  const [contactOpen, setContactOpen] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const contactRef = useRef<HTMLDialogElement>(null);
  const projectRailRef = useRef<HTMLElement>(null);
  const copyTimerRef = useRef<number | undefined>(undefined);
  const active = projects[activeIndex];
  const destination = projectDestination(active);

  const selectProject = (index: number) => {
    const normalized = (index + projects.length) % projects.length;
    setActiveIndex(normalized);
    setViewerIndex(null);
    window.history.replaceState(null, "", `#${projects[normalized].id}`);
  };

  useEffect(() => {
    const onHashChange = () => {
      if (projects.some((project) => `#${project.id}` === window.location.hash)) { setViewerIndex(null); setActiveIndex(projectFromHash()); }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setDetailMode("features");
    const rail = projectRailRef.current;
    const button = rail?.querySelector<HTMLButtonElement>("button[aria-current='page']");
    // Scroll only the rail, so project changes never jump the whole page on a phone.
    if (rail && button && rail.scrollWidth > rail.clientWidth) {
      rail.scrollTo({ left: button.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2 });
    }
    document.title = `${projects[activeIndex].title} · BezeeR // Spirit Terminal`;
  }, [activeIndex]);

  useEffect(() => {
    const keyHandler = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (contactOpen || viewerIndex !== null || target?.closest("input, textarea, select, button, a, .project-showcase, [contenteditable='true']") || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        selectProject(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
      }
      const number = Number(event.key);
      if (number >= 1 && number <= projects.length) selectProject(number - 1);
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [activeIndex, contactOpen, viewerIndex]);

  useEffect(() => {
    const dialog = contactRef.current;
    if (!dialog) return;
    if (contactOpen) dialog.showModal();
    else if (dialog.open) dialog.close();
    if (!contactOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalOverflow; };
  }, [contactOpen]);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  const copyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(`${DISCORD_USERNAME} (${DISCORD_USER_ID})`);
      setDiscordCopied(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setDiscordCopied(false), 1800);
    } catch {
      setDiscordCopied(false);
    }
  };

  const handleProjectKeys = (event: KeyboardEvent<HTMLElement>) => {
    let next = activeIndex;
    if (["ArrowRight", "ArrowDown"].includes(event.key)) next += 1;
    else if (["ArrowLeft", "ArrowUp"].includes(event.key)) next -= 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = projects.length - 1;
    else return;
    event.preventDefault();
    selectProject(next);
    projectRailRef.current?.querySelectorAll("button")[(next + projects.length) % projects.length]?.focus({ preventScroll: true });
  };

  const handleDetailKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "features" : event.key === "End" ? "stack" : detailMode === "features" ? "stack" : "features";
    setDetailMode(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`#${next}-tab`)?.focus();
  };

  const projectStyle = { "--project-accent": PROJECT_ACCENTS[activeIndex % PROJECT_ACCENTS.length] } as CSSProperties;

  return (
    <AmbientAudioProvider>
      <PortfolioArrival />
      <a className="skip-link" href="#project-content">Skip to project content</a>
      <div className="site-shell" style={projectStyle}>
        <BroadcastAtmosphere />
        <div className="vhs-lines" aria-hidden="true" />

        <header className="topbar">
          <a className="identity" href="#cardslate-desktop" aria-label="BezeeR portfolio home">
            <span className="identity-mark">ST</span>
            <span className="identity-copy"><b>BEZEER</b><small>SPIRIT TERMINAL // FULL-STACK</small></span>
          </a>
          <div className="system-state"><i /> AFTER HOURS PROJECT BLOCK // SIGNAL CLEAR</div>
          <div className="topbar-actions">
            <AmbientAudio />
            <nav aria-label="Portfolio links">
              <a className="nav-chip" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub profile" title="GitHub profile"><span aria-hidden="true">GH</span><b>GITHUB</b></a>
              <a className="nav-chip discord-chip" href={DISCORD_URL} target="_blank" rel="noreferrer" aria-label={`Discord: ${DISCORD_USERNAME}`} title={`Discord: ${DISCORD_USERNAME}`}><span aria-hidden="true">DC</span><b>DISCORD</b></a>
              <button className="nav-chip" type="button" onClick={() => setContactOpen(true)} aria-label="Open contact console" title="Open contact console"><span aria-hidden="true">@</span><b>CONTACT</b></button>
            </nav>
          </div>
        </header>

        <main className="workspace">
          <nav className="project-rail" aria-label="Project navigation" ref={projectRailRef} onKeyDown={handleProjectKeys}>
            <div className="rail-label"><span>PROJECT_ARENA</span><b>SELECT ENTRY</b></div>
            {projects.map((project, index) => (
              <button type="button" className={index === activeIndex ? "active" : ""} onClick={() => selectProject(index)} key={project.id} aria-current={index === activeIndex ? "page" : undefined} aria-controls="project-content" aria-label={`Open ${project.title}`}>
                <span>{project.number}</span><b>{project.title}</b><i />
              </button>
            ))}
            <div className="rail-help">KEYS ↑ ↓ // 1—{projects.length}</div>
          </nav>

          <section className="project-stage" id="project-content" tabIndex={-1} aria-labelledby="active-project-title"
            onTouchStart={(event) => {
              touchStart.current = null;
              if ((event.target as HTMLElement).closest("a, button, input, .radio-dock, .project-showcase")) return;
              const touch = event.changedTouches[0];
              if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchCancel={() => { touchStart.current = null; }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              const end = event.changedTouches[0];
              touchStart.current = null;
              if (!start || !end) return;
              const deltaX = end.clientX - start.x;
              const deltaY = end.clientY - start.y;
              if (Math.abs(deltaX) >= 72 && Math.abs(deltaX) >= Math.abs(deltaY) * 1.25) selectProject(activeIndex + (deltaX < 0 ? 1 : -1));
            }}>
            <div className="project-copy">
              <div className="project-intro" key={`intro-${active.id}`}>
                <div className="broadcast-card"><span>NEXT MATCH</span><b>{active.title.toUpperCase()}</b><i>VS.</i><strong>{active.challenge}</strong></div>
                <div className="project-kicker"><span>{active.number}</span>{active.eyebrow}</div>
                <h1 id="active-project-title">{active.title}</h1>
                <p className="descriptor">{active.descriptor}</p>
                <p className="summary">{active.summary}</p>
                <div className="project-actions">
                  <button type="button" className="showcase-primary" onClick={() => setViewerIndex(0)}>VIEW PROJECT <span aria-hidden="true">↗</span></button>
                  {destination ? <a href={destination.href} target="_blank" rel="noopener noreferrer">{destination.label} <span aria-hidden="true">↗</span></a> : <span className="project-action-disabled">{active.visual === "afterhours" ? "PRIVATE ALPHA" : "DISCORD ACTIVITY"}</span>}
                </div>
                <p className="project-platform">{projectPlatform(active)}</p>
                <div className="project-meta"><span><small>CLASS / ROLE</small>{active.role}</span><span><small>RELEASE STATUS</small>{active.status}</span></div>
              </div>

              <div className="detail-column">
                <AmbientAudioPanel />
                <aside className="detail-panel" aria-label={`${active.title} details`}>
                  <div className="detail-tabs" role="tablist" aria-label="Project information" onKeyDown={handleDetailKeys}>
                    <button type="button" id="features-tab" role="tab" aria-selected={detailMode === "features"} aria-controls="project-details" tabIndex={detailMode === "features" ? 0 : -1} className={detailMode === "features" ? "active" : ""} onClick={() => setDetailMode("features")}>TECHNIQUES</button>
                    <button type="button" id="stack-tab" role="tab" aria-selected={detailMode === "stack"} aria-controls="project-details" tabIndex={detailMode === "stack" ? 0 : -1} className={detailMode === "stack" ? "active" : ""} onClick={() => setDetailMode("stack")}>LOADOUT</button>
                  </div>
                  <div id="project-details" role="tabpanel" aria-labelledby={`${detailMode}-tab`} tabIndex={0}>
                    {detailMode === "features" ? <ol>{active.features.map((feature, index) => <li key={feature}><span>{String(index + 1).padStart(2, "0")}</span>{feature}</li>)}</ol> : <div className="stack-cloud">{active.stack.map((item) => <span key={item}>{item}</span>)}</div>}
                  </div>
                </aside>
              </div>
            </div>

            <div className="visual-column" key={`visual-${active.id}`}>
              <div className="visual-frame has-showcase">
                <div className="corner c1" /><div className="corner c2" /><div className="corner c3" /><div className="corner c4" />
                <div className="visual-label">ARENA_FEED // {active.id.toUpperCase()}</div>
                <div className="broadcast-time">02:17:0{activeIndex + 1} // CH.03</div>
                <ProjectShowcase project={active} key={active.id} onExpand={setViewerIndex} />
              </div>
              <div className="telemetry">{active.telemetry.map((item) => <span key={item.label}><small>{item.label}</small><b>{item.value}</b></span>)}</div>
              <div className="mobile-project-controls" aria-label="Project controls">
                <button type="button" onClick={() => selectProject(activeIndex - 1)}>← PREV</button><span>{activeIndex + 1} / {projects.length}</span><button type="button" onClick={() => selectProject(activeIndex + 1)}>NEXT →</button>
              </div>
            </div>
          </section>
        </main>

        <div className="broadcast-bug" aria-hidden="true"><span>SPIRIT TERMINAL</span><b>ORIGINAL AFTER HOURS BLOCK</b></div>

        {viewerIndex !== null && <ProjectViewer project={active} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />}

        <dialog ref={contactRef} className="contact-overlay" aria-labelledby="contact-title" onCancel={() => setContactOpen(false)} onClose={() => setContactOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setContactOpen(false); }}>
          <div className="contact-console">
            <div className="contact-head"><span>OPEN_CHANNEL // AFTER_HOURS</span><button type="button" onClick={() => setContactOpen(false)} aria-label="Close contact console">×</button></div>
            <div className="contact-scroll">
              <div className="contact-copy">
                <small>NEW TRANSMISSION</small><h2 id="contact-title">Enter the next build.</h2>
                <p>Have a project, role, collaboration, or product idea? Reach me directly on Discord or explore my work on GitHub.</p>
                <div className="direct-channels">
                  <a href={DISCORD_URL} target="_blank" rel="noreferrer"><span>DC</span><b>Discord @{DISCORD_USERNAME}</b><i>OPEN ↗</i></a>
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer"><span>GH</span><b>github.com/BezeeR</b><i>OPEN ↗</i></a>
                  <button type="button" onClick={copyDiscord}><span>DC</span><b>{DISCORD_USERNAME}<small>ID {DISCORD_USER_ID}</small></b><i aria-live="polite">{discordCopied ? "COPIED ✓" : "COPY"}</i></button>
                </div>
              </div>
            </div>
          </div>
        </dialog>

        <footer className="statusbar"><span>SPIRIT_TERMINAL v0.6</span><span><i /> NIGHT SIGNAL NOMINAL</span><span className="footer-socials"><a href={GITHUB_URL} target="_blank" rel="noreferrer">GITHUB</a><b>·</b><a href={DISCORD_URL} target="_blank" rel="noreferrer">DISCORD @{DISCORD_USERNAME}</a></span><span>{new Date().getFullYear()} // REACT + TYPESCRIPT + NODE</span></footer>
      </div>
    </AmbientAudioProvider>
  );
}

export default App;
