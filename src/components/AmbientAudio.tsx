import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const VIDEO_ID = "_eIxgFwbFkY";
const YOUTUBE_API_SRC = "https://www.youtube.com/iframe_api";
const VOLUME_KEY = "spirit-terminal-midnight-radio-volume";
const DEFAULT_VOLUME = 0.34;
const FALLBACK_TITLE = "Late-night coding mix";

interface YouTubeVideoData {
  title?: string;
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getVideoData: () => YouTubeVideoData;
  getIframe: () => HTMLIFrameElement;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
}

interface YouTubePlayerErrorEvent {
  data: number;
  target: YouTubePlayer;
}

interface YouTubePlayerStateEvent {
  data: number;
  target: YouTubePlayer;
}

interface YouTubePlayerOptions {
  width: number | string;
  height: number | string;
  videoId: string;
  host?: string;
  playerVars: Record<string, number | string>;
  events: {
    onReady: (event: YouTubePlayerEvent) => void;
    onStateChange: (event: YouTubePlayerStateEvent) => void;
    onError: (event: YouTubePlayerErrorEvent) => void;
  };
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: YouTubePlayerOptions,
  ) => YouTubePlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

function getSavedVolume(): number {
  if (typeof window === "undefined") {
    return DEFAULT_VOLUME;
  }

  const savedValue = window.localStorage.getItem(VOLUME_KEY);
  const parsedValue = savedValue === null ? DEFAULT_VOLUME : Number(savedValue);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(1, Math.max(0, parsedValue));
}

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousReadyCallback = window.onYouTubeIframeAPIReady;
    let settled = false;

    const resolveApi = () => {
      if (settled) {
        return;
      }

      if (!window.YT?.Player) {
        reject(new Error("The YouTube player API did not initialize."));
        settled = true;
        return;
      }

      settled = true;
      resolve(window.YT);
    };

    window.onYouTubeIframeAPIReady = () => {
      previousReadyCallback?.();
      resolveApi();
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${YOUTUBE_API_SRC}"]`,
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = YOUTUBE_API_SRC;
      script.async = true;
      script.onerror = () => {
        if (!settled) {
          settled = true;
          youtubeApiPromise = null;
          reject(new Error("The YouTube player could not be loaded."));
        }
      };
      document.head.appendChild(script);
    }

    window.setTimeout(() => {
      if (!settled) {
        settled = true;
        youtubeApiPromise = null;
        reject(new Error("The YouTube player took too long to load."));
      }
    }, 15_000);
  });

  return youtubeApiPromise;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getPlayerErrorMessage(code: number): string {
  switch (code) {
    case 2:
      return "The YouTube video address is invalid.";
    case 5:
      return "This browser could not play the YouTube video.";
    case 100:
      return "This YouTube video is unavailable.";
    case 101:
    case 150:
      return "The video owner does not allow embedded playback.";
    default:
      return "The YouTube video could not be played.";
  }
}

const playerPanelStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 9px)",
  right: 0,
  zIndex: 100,
  width: "min(330px, calc(100vw - 24px))",
  display: "grid",
  gap: 8,
  padding: 8,
  border: "1px solid rgba(0,168,255,.34)",
  background: "rgba(17,17,20,.98)",
  boxShadow: "0 20px 54px rgba(0,0,0,.62)",
  backdropFilter: "blur(14px)",
};

const playerFrameStyle: CSSProperties = {
  width: "100%",
  height: 200,
  overflow: "hidden",
  background: "#08080a",
};

const playerMetaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
};

const playerTitleStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  color: "#d6d6da",
  font: "700 .54rem var(--font-mono)",
  letterSpacing: ".06em",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const playerTimeStyle: CSSProperties = {
  color: "var(--cyan)",
  font: "700 .48rem var(--font-mono)",
  letterSpacing: ".04em",
  whiteSpace: "nowrap",
};

const progressTrackStyle: CSSProperties = {
  height: 2,
  overflow: "hidden",
  background: "rgba(224,224,224,.12)",
};

const closeButtonStyle: CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  zIndex: 2,
  width: 28,
  height: 28,
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(224,224,224,.18)",
  background: "rgba(10,10,12,.78)",
  color: "#d6d6da",
  font: "700 .72rem var(--font-mono)",
  cursor: "pointer",
};

export function AmbientAudio() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const pendingPlayRef = useRef(false);
  const resumeAfterVisibilityRef = useRef(false);
  const volumeRef = useRef(getSavedVolume());

  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [volume, setVolume] = useState(volumeRef.current);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [title, setTitle] = useState(FALLBACK_TITLE);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const syncPlayerMetadata = useCallback(() => {
    const player = playerRef.current;

    if (!player) {
      return;
    }

    try {
      const nextTitle = player.getVideoData().title?.trim();
      const nextCurrentTime = player.getCurrentTime();
      const nextDuration = player.getDuration();

      if (nextTitle) {
        setTitle(nextTitle);
      }

      if (Number.isFinite(nextCurrentTime)) {
        setCurrentTime(nextCurrentTime);
      }

      if (Number.isFinite(nextDuration) && nextDuration > 0) {
        setDuration(nextDuration);
      }
    } catch {
      // The iframe may be between states while YouTube swaps its internal player.
    }
  }, []);

  const updateVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));

    volumeRef.current = safeVolume;
    setVolume(safeVolume);
    window.localStorage.setItem(VOLUME_KEY, String(safeVolume));

    try {
      playerRef.current?.setVolume(Math.round(safeVolume * 100));
    } catch {
      // Ignore transient iframe communication errors while the player loads.
    }
  }, []);

  const closePlayer = useCallback(() => {
    pendingPlayRef.current = false;
    resumeAfterVisibilityRef.current = false;

    const player = playerRef.current;

    if (player) {
      try {
        player.pauseVideo();
        player.destroy();
      } catch {
        // The iframe may already be gone during a fast navigation/unmount.
      }
    }

    playerRef.current = null;
    setEnabled(false);
    setReady(false);
    setPanelOpen(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const toggle = useCallback(() => {
    setAudioError(null);

    const player = playerRef.current;

    if (enabled) {
      pendingPlayRef.current = false;
      resumeAfterVisibilityRef.current = false;

      try {
        player?.pauseVideo();
      } catch {
        setAudioError("The YouTube player could not be paused.");
      }

      setEnabled(false);
      return;
    }

    setPanelOpen(true);
    pendingPlayRef.current = true;

    if (player && ready) {
      try {
        player.playVideo();
        pendingPlayRef.current = false;
      } catch {
        setAudioError("The YouTube player could not be started.");
      }
    }
  }, [enabled, ready]);

  useEffect(() => {
    if (!panelOpen || playerRef.current || !playerHostRef.current) {
      return;
    }

    let cancelled = false;

    void loadYouTubeApi()
      .then((YouTube) => {
        if (cancelled || !playerHostRef.current || playerRef.current) {
          return;
        }

        const player = new YouTube.Player(playerHostRef.current, {
          width: "100%",
          height: "100%",
          videoId: VIDEO_ID,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 0,
            controls: 1,
            enablejsapi: 1,
            loop: 1,
            playlist: VIDEO_ID,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) {
                event.target.destroy();
                return;
              }

              playerRef.current = event.target;
              event.target.setVolume(Math.round(volumeRef.current * 100));

              const iframe = event.target.getIframe();
              iframe.title = "YouTube player for Midnight Radio";
              iframe.style.width = "100%";
              iframe.style.height = "100%";
              iframe.style.display = "block";
              iframe.style.border = "0";

              setReady(true);
              syncPlayerMetadata();

              if (pendingPlayRef.current) {
                pendingPlayRef.current = false;
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              const isPlaying =
                event.data === YouTube.PlayerState.PLAYING;

              setEnabled(isPlaying);

              if (isPlaying) {
                setAudioError(null);
                setPanelOpen(true);
              }

              syncPlayerMetadata();
            },
            onError: (event) => {
              pendingPlayRef.current = false;
              setEnabled(false);
              setAudioError(getPlayerErrorMessage(event.data));
            },
          },
        });

        playerRef.current = player;
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "The YouTube player could not be loaded.";

        pendingPlayRef.current = false;
        setEnabled(false);
        setReady(false);
        setAudioError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [panelOpen, syncPlayerMetadata]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    syncPlayerMetadata();
    const timer = window.setInterval(syncPlayerMetadata, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, [panelOpen, syncPlayerMetadata]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      if (document.hidden) {
        let wasPlaying = enabled;

        try {
          wasPlaying =
            player.getPlayerState() === window.YT?.PlayerState.PLAYING;
        } catch {
          // Fall back to React state when the iframe is temporarily unavailable.
        }

        resumeAfterVisibilityRef.current = wasPlaying;

        if (wasPlaying) {
          player.pauseVideo();
        }

        return;
      }

      if (resumeAfterVisibilityRef.current) {
        resumeAfterVisibilityRef.current = false;
        player.playVideo();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);

  useEffect(() => {
    return () => {
      const player = playerRef.current;

      if (player) {
        try {
          player.destroy();
        } catch {
          // The YouTube iframe may already have been removed.
        }
      }

      playerRef.current = null;
    };
  }, []);

  const progress =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const timeLabel = `${formatTime(currentTime)} / ${formatTime(duration)}`;
  const statusText = audioError
    ? "YouTube unavailable — click to retry"
    : enabled
      ? `${title} · ${timeLabel}`
      : ready
        ? `${title} · ready`
        : panelOpen
          ? "Loading YouTube player…"
          : "Play YouTube late-night mix";

  return (
    <div
      className={`audio-control${enabled ? " playing" : ""}${
        audioError ? " audio-error" : ""
      }`}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={
          enabled
            ? `Pause YouTube audio: ${title}`
            : `Play YouTube audio: ${title}`
        }
      >
        <span className="audio-icon" aria-hidden="true">
          {enabled ? "Ⅱ" : "▶"}
        </span>

        <span
          className="audio-label"
          style={{ minWidth: 0, maxWidth: 158 }}
        >
          <b>MIDNIGHT RADIO</b>
          <small
            title={statusText}
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {statusText}
          </small>
        </span>

        <span className="audio-meter" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </button>

      <label title="YouTube music volume">
        <span className="sr-only">YouTube music volume</span>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => {
            setAudioError(null);
            updateVolume(Number(event.currentTarget.value));
          }}
          aria-label="YouTube music volume"
        />
      </label>

      {panelOpen ? (
        <section
          style={playerPanelStyle}
          aria-label="Midnight Radio YouTube player"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={closePlayer}
            style={closeButtonStyle}
            aria-label="Close YouTube player"
            title="Close player"
          >
            ×
          </button>

          <div ref={playerHostRef} style={playerFrameStyle} />

          <div style={playerMetaStyle}>
            <span style={playerTitleStyle} title={title}>
              {audioError ?? title}
            </span>
            <time style={playerTimeStyle}>{timeLabel}</time>
          </div>

          <div
            style={progressTrackStyle}
            role="progressbar"
            aria-label="Video playback progress"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, Math.floor(duration))}
            aria-valuenow={Math.max(0, Math.floor(currentTime))}
            aria-valuetext={timeLabel}
          >
            <span
              aria-hidden="true"
              style={{
                display: "block",
                width: `${progress}%`,
                height: "100%",
                background: "var(--cyan)",
                transition: "width .35s linear",
              }}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default AmbientAudio;
