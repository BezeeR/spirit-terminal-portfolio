import { useCallback, useEffect, useId, useRef, useState } from "react";

const VIDEO_ID = "_eIxgFwbFkY";
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const FALLBACK_TITLE = "FULL VINYL | Nujabes | Jazzy Hiphop Set | Elly";
const VOLUME_KEY = "spirit-terminal-midnight-radio-volume";
const DEFAULT_VOLUME = 0.34;
const TIME_UPDATE_MS = 500;

interface YouTubeVideoData {
  title?: string;
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getVideoData: () => YouTubeVideoData;
  destroy: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data?: number;
}

interface YouTubePlayerOptions {
  width: string;
  height: string;
  videoId: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: (event: YouTubePlayerEvent) => void;
    onStateChange: (event: YouTubePlayerEvent) => void;
    onError: (event: YouTubePlayerEvent) => void;
  };
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement | string,
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

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    const previousReadyHandler = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();

      if (window.YT?.Player) {
        resolve(window.YT);
        return;
      }

      reject(new Error("The YouTube player could not be initialized."));
    };

    if (existingScript) {
      existingScript.addEventListener(
        "error",
        () => reject(new Error("The YouTube player could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.addEventListener(
      "error",
      () => reject(new Error("The YouTube player could not be loaded.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function getSavedVolume(): number {
  if (typeof window === "undefined") {
    return DEFAULT_VOLUME;
  }

  const storedVolume = Number(window.localStorage.getItem(VOLUME_KEY));

  if (!Number.isFinite(storedVolume)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(1, Math.max(0, storedVolume));
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const roundedSeconds = Math.floor(seconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export function AmbientAudio() {
  const hostId = useId().replace(/:/g, "");
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerPromiseRef = useRef<Promise<YouTubePlayer> | null>(null);
  const timeTimerRef = useRef<number | null>(null);
  const resumeAfterTabRef = useRef(false);

  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState(FALLBACK_TITLE);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(getSavedVolume);
  const [audioError, setAudioError] = useState<string | null>(null);

  const updatePlaybackDetails = useCallback((player: YouTubePlayer) => {
    const nextTime = player.getCurrentTime();
    const nextDuration = player.getDuration();
    const nextTitle = player.getVideoData().title;

    if (Number.isFinite(nextTime)) {
      setCurrentTime(nextTime);
    }

    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      setDuration(nextDuration);
    }

    if (nextTitle?.trim()) {
      setTitle(nextTitle.trim());
    }
  }, []);

  const stopTimeUpdates = useCallback(() => {
    if (timeTimerRef.current !== null) {
      window.clearInterval(timeTimerRef.current);
      timeTimerRef.current = null;
    }
  }, []);

  const startTimeUpdates = useCallback(
    (player: YouTubePlayer) => {
      stopTimeUpdates();
      updatePlaybackDetails(player);
      timeTimerRef.current = window.setInterval(() => {
        updatePlaybackDetails(player);
      }, TIME_UPDATE_MS);
    },
    [stopTimeUpdates, updatePlaybackDetails],
  );

  const ensurePlayer = useCallback(async (): Promise<YouTubePlayer> => {
    if (playerRef.current) {
      return playerRef.current;
    }

    if (playerPromiseRef.current) {
      return playerPromiseRef.current;
    }

    setAudioError(null);

    playerPromiseRef.current = loadYouTubeApi().then(
      (YT) =>
        new Promise<YouTubePlayer>((resolve, reject) => {
          const host = document.getElementById(hostId);

          if (!host) {
            reject(new Error("The video panel is not ready yet."));
            return;
          }

          const player = new YT.Player(host, {
            width: "100%",
            height: "100%",
            videoId: VIDEO_ID,
            playerVars: {
              autoplay: 0,
              controls: 1,
              disablekb: 0,
              fs: 1,
              playsinline: 1,
              rel: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: (event) => {
                playerRef.current = event.target;
                event.target.setVolume(Math.round(volume * 100));
                updatePlaybackDetails(event.target);
                setReady(true);
                resolve(event.target);
              },
              onStateChange: (event) => {
                const state = event.data;
                const isPlaying = state === YT.PlayerState.PLAYING;

                setPlaying(isPlaying);
                updatePlaybackDetails(event.target);

                if (isPlaying) {
                  startTimeUpdates(event.target);
                } else {
                  stopTimeUpdates();
                }
              },
              onError: () => {
                const message =
                  "This video cannot be played here. Open it on YouTube instead.";
                setAudioError(message);
                setPlaying(false);
                stopTimeUpdates();
                reject(new Error(message));
              },
            },
          });
        }),
    );

    try {
      return await playerPromiseRef.current;
    } catch (error) {
      playerPromiseRef.current = null;
      throw error;
    }
  }, [hostId, startTimeUpdates, stopTimeUpdates, updatePlaybackDetails, volume]);

  const openPlayer = useCallback(() => {
    setExpanded(true);
    setAudioError(null);
  }, []);

  const collapsePlayer = useCallback(() => {
    playerRef.current?.pauseVideo();
    resumeAfterTabRef.current = false;
    setPlaying(false);
    setExpanded(false);
    stopTimeUpdates();
  }, [stopTimeUpdates]);

  const togglePlayback = useCallback(async () => {
    try {
      if (playing) {
        playerRef.current?.pauseVideo();
        return;
      }

      if (!expanded) {
        setExpanded(true);

        // Wait for the pull-out panel to be visible before starting playback.
        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => resolve());
        });
      }

      const player = await ensurePlayer();
      player.setVolume(Math.round(volume * 100));
      player.playVideo();
    } catch (error) {
      console.error("Unable to start Midnight Radio:", error);
      setAudioError(
        error instanceof Error ? error.message : "The video could not be started.",
      );
      setPlaying(false);
    }
  }, [ensurePlayer, expanded, playing, volume]);

  const updateVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));

    setVolume(safeVolume);
    window.localStorage.setItem(VOLUME_KEY, String(safeVolume));
    playerRef.current?.setVolume(Math.round(safeVolume * 100));
  }, []);

  useEffect(() => {
    if (!expanded || playerRef.current || playerPromiseRef.current) {
      return;
    }

    void ensurePlayer().catch((error) => {
      console.error("Unable to prepare Midnight Radio:", error);
      setAudioError(
        error instanceof Error ? error.message : "The video could not be loaded.",
      );
    });
  }, [ensurePlayer, expanded]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      if (document.hidden) {
        resumeAfterTabRef.current = playing && expanded;
        player.pauseVideo();
        stopTimeUpdates();
        return;
      }

      if (resumeAfterTabRef.current && expanded) {
        resumeAfterTabRef.current = false;
        player.playVideo();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [expanded, playing, stopTimeUpdates]);

  useEffect(() => {
    return () => {
      stopTimeUpdates();
      playerRef.current?.destroy();
      playerRef.current = null;
      playerPromiseRef.current = null;
    };
  }, [stopTimeUpdates]);

  const timeLabel = `${formatTime(currentTime)} / ${formatTime(duration)}`;

  return (
    <div style={{ position: "relative", minWidth: 0 }}>
      <div
        className={`audio-control${playing ? " playing" : ""}${
          audioError ? " audio-error" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => void togglePlayback()}
          aria-pressed={playing}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          title={playing ? "Pause video" : "Open player and play video"}
        >
          <span className="audio-icon" aria-hidden="true">
            {playing ? "Ⅱ" : "▶"}
          </span>

          <span className="audio-label" style={{ minWidth: 0 }}>
            <b
              title={title}
              style={{
                display: "block",
                maxWidth: "230px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </b>
            <small>
              {audioError
                ? "Player unavailable — open on YouTube"
                : `${timeLabel} • ${playing ? "PLAYING" : ready ? "READY" : "YOUTUBE"}`}
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

        <label title="Video volume">
          <span className="sr-only">Video volume</span>
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
            aria-label="Video volume"
          />
        </label>

        <button
          type="button"
          onClick={expanded ? collapsePlayer : openPlayer}
          aria-expanded={expanded}
          aria-controls="midnight-radio-video-panel"
          aria-label={expanded ? "Collapse video player" : "Expand video player"}
          title={expanded ? "Collapse video" : "Show video"}
          style={{
            width: "34px",
            minWidth: "34px",
            height: "36px",
            display: "grid",
            placeItems: "center",
            padding: 0,
            borderLeft: "1px solid var(--line)",
            color: expanded ? "var(--cyan)" : "var(--muted)",
            font: "700 .6rem var(--font-mono)",
          }}
        >
          <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
        </button>
      </div>

      <section
          id="midnight-radio-video-panel"
          aria-label="Midnight Radio YouTube video player"
          aria-hidden={!expanded}
          style={{
            display: expanded ? "block" : "none",
            position: "fixed",
            zIndex: 120,
            top: "calc(72px + var(--safe-top) + 8px)",
            right: "clamp(8px, 2.4vw, 38px)",
            width: "min(480px, calc(100vw - 16px))",
            padding: "10px",
            border: "1px solid var(--cyan-line)",
            background: "rgba(13, 13, 16, .97)",
            boxShadow: "0 18px 60px rgba(0, 0, 0, .58)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            style={{
              minHeight: "200px",
              aspectRatio: "16 / 9",
              overflow: "hidden",
              background: "#000",
            }}
          >
            <div id={hostId} style={{ width: "100%", height: "100%" }} />
          </div>

          <div
            style={{
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "9px 2px 0",
              color: "var(--muted-dark)",
              font: "600 .47rem var(--font-mono)",
              letterSpacing: ".07em",
            }}
          >
            <span
              title={title}
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
            <a
              href={VIDEO_URL}
              target="_blank"
              rel="noreferrer"
              style={{ flex: "0 0 auto", color: "var(--cyan)" }}
            >
              OPEN ON YOUTUBE ↗
            </a>
          </div>
        </section>
    </div>
  );
}

export default AmbientAudio;
