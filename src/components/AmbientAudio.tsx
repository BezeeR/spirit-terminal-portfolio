import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const TRACKS = [
  {
    id: "w8xEmi539EY",
    fallbackTitle: "MIDNIGHT RADIO // SESSION 01",
  },
  {
    id: "_eIxgFwbFkY",
    fallbackTitle: "FULL VINYL | Nujabes | Jazzy Hiphop Set | Elly",
  },
] as const;

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
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
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

interface RadioContextValue {
  activeTrackIndex: number;
  audioError: string | null;
  currentTime: number;
  duration: number;
  expanded: boolean;
  hostId: string;
  playing: boolean;
  ready: boolean;
  title: string;
  trackTitles: string[];
  volume: number;
  collapsePlayer: () => void;
  openPlayer: () => void;
  selectTrack: (index: number) => void;
  togglePlayback: () => Promise<void>;
  updateVolume: (volume: number) => void;
}

const RadioContext = createContext<RadioContextValue | null>(null);
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

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function useRadio(): RadioContextValue {
  const context = useContext(RadioContext);

  if (!context) {
    throw new Error("Midnight Radio must be used inside AmbientAudioProvider.");
  }

  return context;
}

export function AmbientAudioProvider({ children }: { children: ReactNode }) {
  const hostId = `midnight-radio-${useId().replace(/:/g, "")}`;
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerPromiseRef = useRef<Promise<YouTubePlayer> | null>(null);
  const timeTimerRef = useRef<number | null>(null);
  const resumeAfterTabRef = useRef(false);
  const activeTrackIndexRef = useRef(0);
  const playTrackRef = useRef<(index: number, autoplay: boolean) => void>(() => undefined);

  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [trackTitles, setTrackTitles] = useState<string[]>(() =>
    TRACKS.map((track) => track.fallbackTitle),
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(getSavedVolume);
  const [audioError, setAudioError] = useState<string | null>(null);

  const title = trackTitles[activeTrackIndex] ?? TRACKS[activeTrackIndex].fallbackTitle;

  const stopTimeUpdates = useCallback(() => {
    if (timeTimerRef.current !== null) {
      window.clearInterval(timeTimerRef.current);
      timeTimerRef.current = null;
    }
  }, []);

  const updatePlaybackDetails = useCallback((player: YouTubePlayer) => {
    const nextTime = player.getCurrentTime();
    const nextDuration = player.getDuration();
    const nextTitle = player.getVideoData().title?.trim();

    if (Number.isFinite(nextTime)) {
      setCurrentTime(nextTime);
    }

    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      setDuration(nextDuration);
    }

    if (nextTitle) {
      const trackIndex = activeTrackIndexRef.current;
      setTrackTitles((currentTitles) => {
        if (currentTitles[trackIndex] === nextTitle) {
          return currentTitles;
        }

        const nextTitles = [...currentTitles];
        nextTitles[trackIndex] = nextTitle;
        return nextTitles;
      });
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
            reject(new Error("The docked video player is not ready yet."));
            return;
          }

          const player = new YT.Player(host, {
            width: "100%",
            height: "100%",
            videoId: TRACKS[activeTrackIndexRef.current].id,
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

                if (state === YT.PlayerState.ENDED) {
                  const nextIndex =
                    (activeTrackIndexRef.current + 1) % TRACKS.length;
                  playTrackRef.current(nextIndex, true);
                  return;
                }

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

  const playTrack = useCallback(
    (index: number, autoplay: boolean) => {
      const normalizedIndex = (index + TRACKS.length) % TRACKS.length;
      const player = playerRef.current;

      activeTrackIndexRef.current = normalizedIndex;
      setActiveTrackIndex(normalizedIndex);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);

      if (!player) {
        return;
      }

      if (autoplay) {
        player.loadVideoById(TRACKS[normalizedIndex].id);
      } else {
        player.cueVideoById(TRACKS[normalizedIndex].id);
      }
    },
    [],
  );

  playTrackRef.current = playTrack;

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
        await waitForLayout();
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

  const selectTrack = useCallback(
    (index: number) => {
      setExpanded(true);
      playTrack(index, true);

      if (!playerRef.current) {
        void waitForLayout()
          .then(() => ensurePlayer())
          .then((player) => {
            player.setVolume(Math.round(volume * 100));
            player.playVideo();
          })
          .catch((error) => {
            console.error("Unable to load queued Midnight Radio track:", error);
            setAudioError(
              error instanceof Error ? error.message : "The track could not be loaded.",
            );
          });
      }
    },
    [ensurePlayer, playTrack, volume],
  );

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

  const contextValue = useMemo<RadioContextValue>(
    () => ({
      activeTrackIndex,
      audioError,
      currentTime,
      duration,
      expanded,
      hostId,
      playing,
      ready,
      title,
      trackTitles,
      volume,
      collapsePlayer,
      openPlayer,
      selectTrack,
      togglePlayback,
      updateVolume,
    }),
    [
      activeTrackIndex,
      audioError,
      collapsePlayer,
      currentTime,
      duration,
      expanded,
      hostId,
      openPlayer,
      playing,
      ready,
      selectTrack,
      title,
      togglePlayback,
      trackTitles,
      updateVolume,
      volume,
    ],
  );

  return <RadioContext.Provider value={contextValue}>{children}</RadioContext.Provider>;
}

export function AmbientAudio() {
  const {
    audioError,
    currentTime,
    duration,
    expanded,
    playing,
    ready,
    title,
    volume,
    collapsePlayer,
    openPlayer,
    togglePlayback,
    updateVolume,
  } = useRadio();
  const timeLabel = `${formatTime(currentTime)} / ${formatTime(duration)}`;

  return (
    <div
      className={`audio-control${playing ? " playing" : ""}${
        audioError ? " audio-error" : ""
      }`}
    >
      <button
        className="audio-main-button"
        type="button"
        onClick={() => void togglePlayback()}
        aria-pressed={playing}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        title={playing ? "Pause video" : "Open docked player and play video"}
      >
        <span className="audio-icon" aria-hidden="true">
          {playing ? "Ⅱ" : "▶"}
        </span>

        <span className="audio-label">
          <b title={title}>{title}</b>
          <small>
            {audioError
              ? "PLAYER UNAVAILABLE"
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
          onChange={(event) => updateVolume(Number(event.currentTarget.value))}
          aria-label="Video volume"
        />
      </label>

      <button
        className="audio-expand-button"
        type="button"
        onClick={expanded ? collapsePlayer : openPlayer}
        aria-expanded={expanded}
        aria-controls="midnight-radio-video-panel"
        aria-label={expanded ? "Collapse video player" : "Expand video player"}
        title={expanded ? "Collapse docked video" : "Show docked video"}
      >
        <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
      </button>
    </div>
  );
}

export function AmbientAudioPanel() {
  const {
    activeTrackIndex,
    audioError,
    expanded,
    hostId,
    title,
    trackTitles,
    collapsePlayer,
    selectTrack,
  } = useRadio();
  const currentTrack = TRACKS[activeTrackIndex];
  const videoUrl = `https://www.youtube.com/watch?v=${currentTrack.id}`;

  return (
    <section
      id="midnight-radio-video-panel"
      className={`radio-dock${expanded ? " is-open" : ""}`}
      aria-label="Midnight Radio YouTube player and queue"
      hidden={!expanded}
    >
      <div className="radio-video-frame">
        <div id={hostId} className="radio-video-host" />
      </div>

      <div className="radio-queue" role="list" aria-label="Midnight Radio queue">
        {TRACKS.map((track, index) => (
          <button
            type="button"
            role="listitem"
            className={index === activeTrackIndex ? "active" : ""}
            onClick={() => selectTrack(index)}
            key={track.id}
            aria-label={`Play queue item ${index + 1}: ${trackTitles[index]}`}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b title={trackTitles[index]}>{trackTitles[index]}</b>
            <i>{index === activeTrackIndex ? "LIVE" : "PLAY"}</i>
          </button>
        ))}
        <a
          className="radio-open-youtube"
          href={videoUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${title} on YouTube`}
          title="Open current video on YouTube"
        >
          ↗
        </a>
        <button
          className="radio-collapse-button"
          type="button"
          onClick={collapsePlayer}
          aria-label="Collapse video player"
          title="Collapse video player"
        >
          ×
        </button>
      </div>

      {audioError && <p className="radio-error" role="status">{audioError}</p>}
    </section>
  );
}

export default AmbientAudio;
