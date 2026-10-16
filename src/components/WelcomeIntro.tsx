import { useEffect, useRef, useState } from "react";
import { INTRO_SEEN_KEY, MUSIC_PREFERENCE_KEY, readPreference, writePreference } from "../lib/preferences";
import { useRadio } from "./AmbientAudio";

const LINES = ["TUNING AFTER_HOURS_SIGNAL...", "OPENING SPIRIT_TERMINAL...", "PROJECT_ARENA READY", "MIDNIGHT BLOCK ONLINE"];

function WelcomeIntro({ onEnter, touchPlayback }: { onEnter: (music: boolean) => void; touchPlayback: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [lineCount, setLineCount] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? LINES.length : 1);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timers = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? [] : LINES.slice(1).map((_, index) => window.setTimeout(() => setLineCount(index + 2), (index + 1) * 220));
    return () => {
      timers.forEach(window.clearTimeout);
      dialog?.close();
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="boot-screen" aria-labelledby="welcome-title" aria-describedby="welcome-description" onCancel={(event) => { event.preventDefault(); onEnter(false); }}>
      <div className="boot-frame">
        <div className="boot-channel"><span>CH 03</span><b>AFTER HOURS</b><i>ORIGINAL BROADCAST</i></div>
        <h1 className="boot-mark" id="welcome-title">SPIRIT<span>_</span></h1>
        <div className="boot-subtitle">TERMINAL // AFTER HOURS PROJECT BLOCK</div>
        <div className="boot-log" aria-hidden="true">
          {LINES.slice(0, lineCount).map((line, index) => <p key={line}><span>{String(index + 1).padStart(2, "0")}</span>{line}</p>)}
        </div>
        <div className="boot-progress" aria-hidden="true"><i style={{ width: `${lineCount / LINES.length * 100}%` }} /></div>
        <p className="boot-description" id="welcome-description">{touchPlayback ? "Welcome to BezeeR’s portfolio. Open the Nujabes set and tap Play, or explore quietly." : "Welcome to BezeeR’s portfolio. Settle into the night shift with the Nujabes set, or explore quietly."}</p>
        <div className="boot-actions">
          <button type="button" onClick={() => onEnter(true)} autoFocus>{touchPlayback ? "ENTER & OPEN RADIO" : "ENTER WITH MUSIC"} <span aria-hidden="true">▶</span></button>
          <button type="button" onClick={() => onEnter(false)}>ENTER QUIETLY</button>
        </div>
        <small className="boot-footnote">{touchPlayback ? "Music starts with a tap in the player. You can enter immediately." : "You can enter immediately. Playback and volume controls stay in the top bar."}</small>
      </div>
    </dialog>
  );
}

export function PortfolioArrival() {
  const [firstVisit, setFirstVisit] = useState(() => readPreference(INTRO_SEEN_KEY) !== "1");
  const startupAttempted = useRef(false);
  const { startPlayback, touchPlayback } = useRadio();

  useEffect(() => {
    if (firstVisit || startupAttempted.current) return;
    startupAttempted.current = true;
    if (readPreference(MUSIC_PREFERENCE_KEY) !== "off") void startPlayback(true);
  }, [firstVisit, startPlayback]);

  const enter = (music: boolean) => {
    startupAttempted.current = true;
    writePreference(INTRO_SEEN_KEY, "1");
    writePreference(MUSIC_PREFERENCE_KEY, music ? "on" : "off");
    setFirstVisit(false);
    if (music) void startPlayback();
    if (!music || !touchPlayback) window.requestAnimationFrame(() => document.getElementById("project-content")?.focus({ preventScroll: true }));
  };

  return firstVisit ? <WelcomeIntro onEnter={enter} touchPlayback={touchPlayback} /> : null;
}
