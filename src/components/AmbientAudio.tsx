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
  useSyncExternalStore,
} from "react";
import { MUSIC_PREFERENCE_KEY, readPreference, writePreference } from "../lib/preferences";

const TRACKS = [
  {
    id: "_eIxgFwbFkY",
    fallbackTitle: "FULL VINYL | Nujabes | Jazzy Hiphop Set | Elly",
  },
] as const;

const VOLUME_KEY = "spirit-terminal-midnight-radio-volume";
const DEFAULT_VOLUME = 0.34;
const TIME_UPDATE_MS = 500;
const TOUCH_PLAYBACK_QUERY = "(hover: none) and (pointer: coarse)";

function subscribeTouchPlayback(onChange: () => void) {
  const query = window.matchMedia(TOUCH_PLAYBACK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function revealPlayer() {
  window.requestAnimationFrame(() => {
    const panel = document.getElementById("midnight-radio-video-panel");
    if (!panel || panel.hidden) return;
    panel.focus({ preventScroll: true });
    panel.scrollIntoView({ block: "start", behavior: "instant" });
  });
}

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
  getIframe?: () => HTMLIFrameElement;
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
    onAutoplayBlocked: (event: YouTubePlayerEvent) => void;
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
  autoplayBlocked: boolean;
  currentTime: number;
  duration: number;
  expanded: boolean;
  hostId: string;
  playing: boolean;
  ready: boolean;
  title: string;
  trackTitles: string[];
  touchPlayback: boolean;
  volume: number;
  collapsePlayer: () => void;
  openPlayer: () => void;
  selectTrack: (index: number) => void;
  togglePlayback: () => Promise<void>;
  startPlayback: (automatic?: boolean) => Promise<void>;
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
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.onYouTubeIframeAPIReady = previousReadyHandler;
      reject(new Error("The YouTube player could not be loaded. You can retry Play or open the set on YouTube."));
    };
    const timeout = window.setTimeout(fail, 10000);

    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();

      if (window.YT?.Player) {
        settled = true;
        window.clearTimeout(timeout);
        resolve(window.YT);
        return;
      }

      fail();
    };

    if (existingScript) {
      existingScript.addEventListener(
        "error",
        fail,
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.addEventListener(
      "error",
      fail,
      { once: true },
    );
    document.head.appendChild(script);
  }).catch((error) => {
    youtubeApiPromise = null;
    document.querySelector('script[src="https://www.youtube.com/iframe_api"]')?.remove();
    throw error;
  });

  return youtubeApiPromise;
}

function getSavedVolume(): number {
  if (typeof window === "undefined") {
    return DEFAULT_VOLUME;
  }

  try {
    const saved = readPreference(VOLUME_KEY);
    const storedVolume = saved === null ? DEFAULT_VOLUME : Number(saved);
    return Number.isFinite(storedVolume) ? Math.min(1, Math.max(0, storedVolume)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
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

export function useRadio(): RadioContextValue {
  const context = useContext(RadioContext);

  if (!context) {
    throw new Error("Midnight Radio must be used inside AmbientAudioProvider.");
  }

  return context;
}

export function AmbientAudioProvider({ children }: { children: ReactNode }) {
  const touchPlayback = useSyncExternalStore(subscribeTouchPlayback, () => window.matchMedia(TOUCH_PLAYBACK_QUERY).matches, () => false);
  const hostId = `midnight-radio-${useId().replace(/:/g, "")}`;
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerPromiseRef = useRef<Promise<YouTubePlayer> | null>(null);
  const preparingPlayerRef = useRef(false);
  const timeTimerRef = useRef<number | null>(null);
  const resumeAfterTabRef = useRef(false);
  const playbackRequestedRef = useRef(false);
  const hasPlayedRef = useRef(false);
  const activeTrackIndexRef = useRef(0);
  const playTrackRef = useRef<(index: number, autoplay: boolean) => void>(() => undefined);

  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  expandedRef.current = expanded;
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [trackTitles, setTrackTitles] = useState<string[]>(() =>
    TRACKS.map((track) => track.fallbackTitle),
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(getSavedVolume);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

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
                event.target.getIframe?.().setAttribute("allow", "autoplay; encrypted-media; fullscreen; picture-in-picture");
                event.target.setVolume(Math.round(volume * 100));
                updatePlaybackDetails(event.target);
                setReady(true);
                resolve(event.target);
              },
              onStateChange: (event) => {
                const state = event.data;
                const isPlaying = state === YT.PlayerState.PLAYING;

                setPlaying(isPlaying);
                if (isPlaying) setAutoplayBlocked(false);
                updatePlaybackDetails(event.target);

                if (state === YT.PlayerState.ENDED) {
                  const nextIndex =
                    (activeTrackIndexRef.current + 1) % TRACKS.length;
                  if (playbackRequestedRef.current) playTrackRef.current(nextIndex, true);
                  return;
                }

                if (isPlaying && (!expandedRef.current || document.hidden)) {
                  event.target.pauseVideo();
                  return;
                }
                if (isPlaying) {
                  hasPlayedRef.current = true;
                  playbackRequestedRef.current = true;
                  writePreference(MUSIC_PREFERENCE_KEY, "on");
                  startTimeUpdates(event.target);
                } else {
                  if (state === YT.PlayerState.PAUSED && hasPlayedRef.current && !document.hidden && expandedRef.current && playbackRequestedRef.current) {
                    playbackRequestedRef.current = false;
                    writePreference(MUSIC_PREFERENCE_KEY, "off");
                  }
                  if (state === YT.PlayerState.PAUSED) hasPlayedRef.current = false;
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
              onAutoplayBlocked: () => {
                hasPlayedRef.current = false;
                setAutoplayBlocked(true);
                setPlaying(false);
                stopTimeUpdates();
                if (touchPlayback) revealPlayer();
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
  }, [hostId, startTimeUpdates, stopTimeUpdates, touchPlayback, updatePlaybackDetails, volume]);

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
    expandedRef.current = true;
    setExpanded(true);
    setAudioError(null);
    if (touchPlayback) revealPlayer();
  }, [touchPlayback]);

  const collapsePlayer = useCallback(() => {
    playbackRequestedRef.current = false;
    writePreference(MUSIC_PREFERENCE_KEY, "off");
    expandedRef.current = false;
    playerRef.current?.pauseVideo();
    resumeAfterTabRef.current = false;
    setPlaying(false);
    setExpanded(false);
    setAutoplayBlocked(false);
    stopTimeUpdates();
  }, [stopTimeUpdates]);

  const startPlayback = useCallback(async (automatic = false) => {
    const directPlayer = playerRef.current;
    // Touch visitors start inside the video after it loads. A ready player's
    // explicit Play stays in the original click handler, before any await.
    const prepareOnly = touchPlayback && (automatic || !directPlayer || !expanded);
    playbackRequestedRef.current = !prepareOnly;
    setAutoplayBlocked(false);
    setAudioError(null);
    if (!automatic) writePreference(MUSIC_PREFERENCE_KEY, "on");
    preparingPlayerRef.current = true;
    try {
      if (prepareOnly && !automatic) revealPlayer();
      if (directPlayer && !prepareOnly) {
        expandedRef.current = true;
        setExpanded(true);
        directPlayer.setVolume(Math.round(volume * 100));
        directPlayer.playVideo();
        return;
      }

      if (!expanded) {
        expandedRef.current = true;
        setExpanded(true);
        await waitForLayout();
      }

      const player = await ensurePlayer();
      if (prepareOnly) return;
      if (!playbackRequestedRef.current || document.hidden) return;
      player.setVolume(Math.round(volume * 100));
      player.playVideo();
    } catch (error) {
      console.error("Unable to start Midnight Radio:", error);
      setAudioError(
        error instanceof Error ? error.message : "The video could not be started.",
      );
      setPlaying(false);
    } finally {
      preparingPlayerRef.current = false;
    }
  }, [ensurePlayer, expanded, touchPlayback, volume]);

  const togglePlayback = useCallback(async () => {
    if (!playing) return startPlayback();
    playbackRequestedRef.current = false;
    resumeAfterTabRef.current = false;
    writePreference(MUSIC_PREFERENCE_KEY, "off");
    playerRef.current?.pauseVideo();
    setPlaying(false);
    stopTimeUpdates();
  }, [playing, startPlayback, stopTimeUpdates]);

  const selectTrack = useCallback(
    (index: number) => {
      playbackRequestedRef.current = true;
      writePreference(MUSIC_PREFERENCE_KEY, "on");
      setAutoplayBlocked(false);
      expandedRef.current = true;
      setExpanded(true);
      playTrack(index, Boolean(playerRef.current));

      if (!playerRef.current) {
        void startPlayback();
      }
    },
    [playTrack, startPlayback],
  );

  const updateVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));

    setVolume(safeVolume);
    writePreference(VOLUME_KEY, String(safeVolume));
    playerRef.current?.setVolume(Math.round(safeVolume * 100));
  }, []);

  useEffect(() => {
    // An explicit start owns its load attempt, including failures and retries.
    if (!expanded || playerRef.current || playerPromiseRef.current || preparingPlayerRef.current) {
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

      if (resumeAfterTabRef.current && expanded && playbackRequestedRef.current) {
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
      autoplayBlocked,
      currentTime,
      duration,
      expanded,
      hostId,
      playing,
      ready,
      title,
      trackTitles,
      touchPlayback,
      volume,
      collapsePlayer,
      openPlayer,
      selectTrack,
      togglePlayback,
      startPlayback,
      updateVolume,
    }),
    [
      activeTrackIndex,
      audioError,
      autoplayBlocked,
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
      startPlayback,
      trackTitles,
      touchPlayback,
      updateVolume,
      volume,
    ],
  );

  return <RadioContext.Provider value={contextValue}>{children}</RadioContext.Provider>;
}

export function AmbientAudio() {
  const {
    audioError,
    autoplayBlocked,
    currentTime,
    duration,
    expanded,
    playing,
    ready,
    title,
    touchPlayback,
    volume,
    collapsePlayer,
    openPlayer,
    togglePlayback,
    updateVolume,
  } = useRadio();
  const timeLabel = `${formatTime(currentTime)} / ${formatTime(duration)}`;
  const needsTap = !playing && (autoplayBlocked || (touchPlayback && ready));

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
        aria-label={playing ? `Pause ${title}` : needsTap ? `Start music: ${title}` : `Play ${title}`}
        title={playing ? "Pause video" : "Open docked player and play video"}
      >
        <span className="audio-icon" aria-hidden="true">
          {playing ? "Ⅱ" : "▶"}
        </span>

        <span className="audio-label">
          <b title={title}>{needsTap ? "TAP TO START MUSIC" : title}</b>
          <small>
            {audioError
              ? "PLAYER UNAVAILABLE"
              : `${timeLabel} • ${playing ? "PLAYING" : ready ? "READY" : expanded ? "LOADING" : "YOUTUBE"}`}
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
          step="0.01"
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
    autoplayBlocked,
    expanded,
    hostId,
    playing,
    ready,
    title,
    trackTitles,
    touchPlayback,
    collapsePlayer,
    selectTrack,
    startPlayback,
  } = useRadio();
  const currentTrack = TRACKS[activeTrackIndex];
  const videoUrl = `https://www.youtube.com/watch?v=${currentTrack.id}`;

  return (
    <section
      id="midnight-radio-video-panel"
      className={`radio-dock${expanded ? " is-open" : ""}`}
      aria-label="Midnight Radio YouTube player and queue"
      tabIndex={-1}
      hidden={!expanded}
    >
      {!audioError && (touchPlayback || autoplayBlocked) && (
        <div className="radio-play-prompt" role="status">
          <b>MIDNIGHT RADIO</b>
          <span>{playing ? "Now playing. Pause in the video or use the top bar." : ready ? "Tap ▶ in the video below to start the Nujabes set." : "Loading the player. Tap ▶ in the video when it’s ready."}</span>
          {!touchPlayback && <button type="button" onClick={() => void startPlayback()}>PLAY MUSIC ▶</button>}
        </div>
      )}
      <div className="radio-video-frame">
        <div id={hostId} className="radio-video-host" />
      </div>

      <div className="radio-queue" role="group" aria-label="Midnight Radio controls">
        {TRACKS.map((track, index) => (
          <button
            type="button"
            className={index === activeTrackIndex ? "active" : ""}
            onClick={() => selectTrack(index)}
            key={track.id}
            aria-label={`Play queue item ${index + 1}: ${trackTitles[index]}`}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b title={trackTitles[index]}>{trackTitles[index]}</b>
            <i>{index === activeTrackIndex ? playing ? "PLAYING" : ready ? "READY" : "LOADING" : "PLAY"}</i>
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
