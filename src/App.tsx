import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AmbientAudio, AmbientAudioPanel, AmbientAudioProvider } from "./components/AmbientAudio";
import { BroadcastAtmosphere } from "./components/BroadcastAtmosphere";
import { MatrixRain } from "./components/MatrixRain";
import { ProjectVisual } from "./components/ProjectVisual";
import { ScrambleText } from "./components/ScrambleText";
import { projects as fallbackProjects, type Project } from "./data/projects";
import "./styles.css";

const GITHUB_URL = "https://github.com/BezeeR";
const DISCORD_URL = "https://discord.com/users/171078389166243840";
const DISCORD_USERNAME = "bezeer";
const DISCORD_USER_ID = "171078389166243840";
const PROJECT_ACCENTS = ["#00A8FF", "#5E1174", "#FFCC00", "#FF66B2"];

function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [line, setLine] = useState(0);
  const lines = [
    "TUNING AFTER_HOURS_SIGNAL...",
    "OPENING SPIRIT_TERMINAL...",
    "LOADING PROJECT_ARENA...",
    "VERIFYING BUILD: 0 ERRORS",
    "MIDNIGHT BLOCK ONLINE"
  ];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    const timer = window.setInterval(() => {
      setLine((value) => {
        if (value >= lines.length - 1) {
          window.clearInterval(timer);
          window.setTimeout(onComplete, 360);
          return value;
        }
        return value + 1;
      });
    }, 285);
    return () => window.clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="boot-screen" role="status" aria-live="polite">
      <div className="boot-frame">
        <div className="boot-channel"><span>CH 03</span><b>02:17 AM</b><i>ORIGINAL BROADCAST</i></div>
        <div className="boot-mark">SPIRIT<span>_</span></div>
        <div className="boot-subtitle">TERMINAL // AFTER HOURS PROJECT BLOCK</div>
        <div className="boot-log">
          {lines.slice(0, line + 1).map((item, index) => (
            <p key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</p>
          ))}
        </div>
        <div className="boot-progress" aria-hidden="true"><i style={{ width: `${((line + 1) / lines.length) * 100}%` }} /></div>
      </div>
    </div>
  );
}

function App() {
  const previewMode = new URLSearchParams(window.location.search).has("preview");
  const [booting, setBooting] = useState(() => {
    if (previewMode) return false;
    try {
      return window.sessionStorage.getItem("portfolio-boot-complete") !== "1";
    } catch {
      return true;
    }
  });
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailMode, setDetailMode] = useState<"features" | "stack">("features");
  const [contactOpen, setContactOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [discordCopied, setDiscordCopied] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contactConsoleRef = useRef<HTMLElement>(null);
  const projectRailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1800);
    fetch("/api/projects", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("API unavailable")))
      .then((data: Project[]) => data.length && setProjects(data))
      .catch(() => undefined)
      .finally(() => window.clearTimeout(timeout));
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(projects.length - 1, 0)));
  }, [projects.length]);

  useEffect(() => {
    setDetailMode("features");
    const activeButton = projectRailRef.current?.querySelector<HTMLButtonElement>("button[aria-current='page']");
    activeButton?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInteractive = target?.matches("input, textarea, select, button, a, [contenteditable='true']");
      if (contactOpen || isInteractive || event.altKey || event.ctrlKey || event.metaKey || !projects.length) return;

      if (["ArrowRight", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % projects.length);
      }
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + projects.length) % projects.length);
      }
      if (event.key === "Home") setActiveIndex(0);
      if (event.key === "End") setActiveIndex(projects.length - 1);
      const number = Number(event.key);
      if (number >= 1 && number <= projects.length) setActiveIndex(number - 1);
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [contactOpen, projects.length]);

  const active = useMemo(() => projects[activeIndex] ?? fallbackProjects[0], [activeIndex, projects]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContactOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!contactOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => { document.body.style.overflow = originalOverflow; };
  }, [contactOpen]);

  const completeBoot = () => {
    try { window.sessionStorage.setItem("portfolio-boot-complete", "1"); } catch { /* privacy mode */ }
    setBooting(false);
  };

  const handleContactKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      contactConsoleRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setContactStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          company: data.get("company")
        })
      });
      if (!response.ok) throw new Error("Message could not be saved.");
      form.reset();
      setContactStatus("sent");
    } catch {
      setContactStatus("error");
    }
  };

  const copyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(`${DISCORD_USERNAME} (${DISCORD_USER_ID})`);
      setDiscordCopied(true);
      window.setTimeout(() => setDiscordCopied(false), 1800);
    } catch {
      setDiscordCopied(false);
    }
  };

  const moveProject = (direction: 1 | -1) => {
    if (!projects.length) return;
    setActiveIndex((index) => (index + direction + projects.length) % projects.length);
  };

  const projectStyle = { "--project-accent": PROJECT_ACCENTS[activeIndex % PROJECT_ACCENTS.length] } as CSSProperties;

  return (
    <AmbientAudioProvider>
      <>
      <a className="skip-link" href="#project-content">Skip to project content</a>
      {booting && <BootScreen onComplete={completeBoot} />}
      <div className={`site-shell ${booting ? "site-hidden" : ""}`} style={projectStyle}>
        <BroadcastAtmosphere />
        {!previewMode && <MatrixRain />}
        <div className="noise" aria-hidden="true" />
        <div className="vhs-lines" aria-hidden="true" />

        <header className="topbar">
          <a className="identity" href="#top" aria-label="BezeeR portfolio home">
            <span className="identity-mark">ST</span>
            <span className="identity-copy"><b>BEZEER</b><small>SPIRIT TERMINAL // FULL-STACK</small></span>
          </a>
          <div className="system-state"><i /> AFTER HOURS PROJECT BLOCK // SIGNAL CLEAR</div>
          <div className="topbar-actions">
            <AmbientAudio />
            <nav aria-label="Portfolio links">
              <a className="nav-chip" href={GITHUB_URL} target="_blank" rel="noreferrer" title="GitHub profile"><span aria-hidden="true">GH</span><b>GITHUB</b></a>
              <a className="nav-chip discord-chip" href={DISCORD_URL} target="_blank" rel="noreferrer" title={`Discord: ${DISCORD_USERNAME}`}><span aria-hidden="true">DC</span><b>DISCORD</b></a>
              <button className="nav-chip" type="button" onClick={() => { setContactOpen(true); setContactStatus("idle"); }} title="Open contact console"><span aria-hidden="true">@</span><b>CONTACT</b></button>
            </nav>
          </div>
        </header>

        <main className="workspace" id="top">
          <aside className="project-rail" aria-label="Project navigation" ref={projectRailRef}>
            <div className="rail-label"><span>PROJECT_ARENA</span><b>SELECT ENTRY</b></div>
            {projects.map((project, index) => (
              <button
                className={index === activeIndex ? "active" : ""}
                onClick={() => setActiveIndex(index)}
                key={project.id}
                aria-current={index === activeIndex ? "page" : undefined}
                aria-label={`Open ${project.title}`}
              >
                <span>{project.number}</span><b>{project.title}</b><i />
              </button>
            ))}
            <div className="rail-help">KEYS ↑ ↓ // 1—{projects.length}</div>
          </aside>

          <section
            className="project-stage"
            id="project-content"
            aria-labelledby="active-project-title"
            onTouchStart={(event) => {
              const touch = event.changedTouches[0];
              if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              const end = event.changedTouches[0];
              touchStart.current = null;
              if (!start || !end) return;
              const deltaX = end.clientX - start.x;
              const deltaY = end.clientY - start.y;
              if (Math.abs(deltaX) < 72 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
              moveProject(deltaX < 0 ? 1 : -1);
            }}
          >
            <div className="project-copy">
              <div className="project-intro" key={`intro-${active.id}`}>
                <div className="broadcast-card">
                  <span>NEXT MATCH</span>
                  <b>{active.title.toUpperCase()}</b>
                  <i>VS.</i>
                  <strong>{active.challenge}</strong>
                </div>
                <div className="project-kicker"><span>{active.number}</span><ScrambleText text={active.eyebrow} /></div>
                <h1 id="active-project-title"><ScrambleText text={active.title} /></h1>
                <p className="descriptor">{active.descriptor}</p>
                <p className="summary">{active.summary}</p>
                <div className="project-actions">
                  <a href={active.href} target="_blank" rel="noreferrer">ENTER PROJECT <span>↗</span></a>
                  <button type="button" onClick={() => setDetailMode(detailMode === "features" ? "stack" : "features")}>{detailMode === "features" ? "VIEW LOADOUT" : "VIEW TECHNIQUES"}</button>
                </div>
                <div className="project-meta"><span><small>CLASS / ROLE</small>{active.role}</span><span><small>RELEASE STATUS</small>{active.status}</span></div>
              </div>

              <div className="detail-column">
                <AmbientAudioPanel />
                <aside className="detail-panel" key={`detail-${active.id}`} aria-label={`${active.title} details`}>
                  <div className="detail-tabs" role="tablist" aria-label="Project information">
                    <button role="tab" aria-selected={detailMode === "features"} className={detailMode === "features" ? "active" : ""} onClick={() => setDetailMode("features")}>TECHNIQUES</button>
                    <button role="tab" aria-selected={detailMode === "stack"} className={detailMode === "stack" ? "active" : ""} onClick={() => setDetailMode("stack")}>LOADOUT</button>
                  </div>
                  {detailMode === "features" ? (
                    <ol>{active.features.map((feature, index) => <li key={feature}><span>{String(index + 1).padStart(2, "0")}</span>{feature}</li>)}</ol>
                  ) : (
                    <div className="stack-cloud">{active.stack.map((item) => <span key={item}>{item}</span>)}</div>
                  )}
                </aside>
              </div>
            </div>

            <div className="visual-column" key={`visual-${active.id}`}>
              <div className="visual-frame">
                <div className="corner c1" /><div className="corner c2" /><div className="corner c3" /><div className="corner c4" />
                <div className="visual-label">ARENA_FEED // {active.id.toUpperCase()}</div>
                <div className="broadcast-time">02:17:0{activeIndex + 1} // CH.03</div>
                <ProjectVisual project={active} />
              </div>
              <div className="telemetry">{active.telemetry.map((item) => <span key={item.label}><small>{item.label}</small><b>{item.value}</b></span>)}</div>
              <div className="mobile-project-controls" aria-label="Project controls">
                <button type="button" onClick={() => moveProject(-1)}>← PREV</button>
                <span>{activeIndex + 1} / {projects.length}</span>
                <button type="button" onClick={() => moveProject(1)}>NEXT →</button>
              </div>
            </div>
          </section>
        </main>

        <div className="broadcast-bug" aria-hidden="true"><span>SPIRIT TERMINAL</span><b>ORIGINAL AFTER HOURS BLOCK</b></div>

        {contactOpen && (
          <div className="contact-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setContactOpen(false); }}>
            <section ref={contactConsoleRef} className="contact-console" role="dialog" aria-modal="true" aria-labelledby="contact-title" onKeyDown={handleContactKeyDown}>
              <div className="contact-head"><span>OPEN_CHANNEL // AFTER_HOURS</span><button ref={closeButtonRef} type="button" onClick={() => setContactOpen(false)} aria-label="Close contact form">×</button></div>
              <div className="contact-scroll">
                <div className="contact-copy">
                  <small>NEW TRANSMISSION</small>
                  <h2 id="contact-title">Enter the next build.</h2>
                  <p>Send a project, role, collaboration, or product idea. You can also connect directly through GitHub or Discord.</p>
                  <div className="direct-channels">
                    <a href={GITHUB_URL} target="_blank" rel="noreferrer"><span>GH</span><b>github.com/BezeeR</b><i>OPEN ↗</i></a>
                    <button type="button" onClick={copyDiscord}><span>DC</span><b>{DISCORD_USERNAME}<small>ID {DISCORD_USER_ID}</small></b><i>{discordCopied ? "COPIED ✓" : "COPY"}</i></button>
                  </div>
                </div>
                <form onSubmit={submitContact}>
                  <label className="contact-honeypot" aria-hidden="true"><span>COMPANY</span><input name="company" tabIndex={-1} autoComplete="off" /></label>
                  <label><span>NAME</span><input name="name" autoComplete="name" required maxLength={100} placeholder="Your name" /></label>
                  <label><span>EMAIL</span><input name="email" type="email" autoComplete="email" required maxLength={200} placeholder="you@example.com" /></label>
                  <label><span>MESSAGE</span><textarea name="message" required maxLength={4000} rows={6} placeholder="What are we building?" /></label>
                  <div className="contact-submit"><button type="submit" disabled={contactStatus === "sending"}>{contactStatus === "sending" ? "TRANSMITTING..." : "SEND TRANSMISSION ↗"}</button><span className={`contact-result ${contactStatus}`} aria-live="polite">{contactStatus === "sent" ? "MESSAGE STORED // COMPLETE" : contactStatus === "error" ? "NODE CHANNEL OFFLINE // USE DISCORD" : "NODE + SQLITE CHANNEL"}</span></div>
                </form>
              </div>
            </section>
          </div>
        )}

        <footer className="statusbar">
          <span>SPIRIT_TERMINAL v0.4</span>
          <span><i /> NIGHT SIGNAL NOMINAL</span>
          <span className="footer-socials"><a href={GITHUB_URL} target="_blank" rel="noreferrer">GITHUB</a><b>·</b><a href={DISCORD_URL} target="_blank" rel="noreferrer">DISCORD @{DISCORD_USERNAME}</a></span>
          <span>{new Date().getFullYear()} // REACT + NODE + SQL</span>
        </footer>
      </div>
      </>
    </AmbientAudioProvider>
  );
}

export default App;
