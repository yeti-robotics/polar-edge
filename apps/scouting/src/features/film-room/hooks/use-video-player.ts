"use client";

import {
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PlayableSource } from "../types";

/**
 * Playback for one Film Room video, over either transport.
 *
 * YouTube goes through the IFrame Player API directly — no new dependency in
 * apps/scouting. Uploaded clips play through a native <video>. Callers get the
 * same controls either way and never branch on the source kind.
 */

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // biome-ignore lint/suspicious/noExplicitAny: YT global is untyped
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });

  return ytApiPromise;
}

/** Spread onto the native <video>; inert for a YouTube source. */
export interface NativeVideoProps {
  onLoadedMetadata: (event: SyntheticEvent<HTMLVideoElement>) => void;
  onPlay: () => void;
  onPause: () => void;
}

export interface VideoPlayer {
  isYouTube: boolean;
  /** Host div the IFrame player replaces. */
  playerHostRef: RefObject<HTMLDivElement | null>;
  videoElRef: RefObject<HTMLVideoElement | null>;
  /** Float playback time, for sub-second fades. Read every frame. */
  floatTimeRef: RefObject<number>;
  /** Whole seconds, for labels and the scrub bar. */
  currentTime: number;
  duration: number;
  playing: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setRate: (rate: number) => void;
  /** Pull the live playback clock into `floatTimeRef` + `currentTime`. */
  syncTime: () => void;
  nativeVideoProps: NativeVideoProps;
}

export function useVideoPlayer(source: PlayableSource, initialTime: number): VideoPlayer {
  const playerHostRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  /** The IFrame player's methods only exist once onReady has fired. */
  const playerReadyRef = useRef(false);
  const floatTimeRef = useRef(0);
  /** Mirrors `duration` so `seekTo` can clamp without a changing identity. */
  const durationRef = useRef(0);
  /** Where a player that isn't ready yet should start, from the ?t= deep link. */
  const startAtRef = useRef(initialTime);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const isYouTube = source.kind === "youtube";
  const youtubeId = isYouTube ? source.value : null;

  const applyDuration = useCallback((seconds: number) => {
    // Some recorders write no duration (Infinity) into the file.
    const safe = Number.isFinite(seconds) ? seconds : 0;
    durationRef.current = safe;
    setDuration(safe);
  }, []);

  /* --- YouTube player lifecycle ------------------------------------------- */
  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !playerHostRef.current) return;
      // biome-ignore lint/suspicious/noExplicitAny: YT global is untyped
      const YT = (window as any).YT;

      playerRef.current = new YT.Player(playerHostRef.current, {
        videoId: youtubeId,
        // No native controls: the annotator owns the chrome and the gestures.
        playerVars: { modestbranding: 1, rel: 0, playsinline: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            playerReadyRef.current = true;
            applyDuration(e.target.getDuration());
            if (startAtRef.current > 0) e.target.seekTo(startAtRef.current, true);
          },
          onStateChange: (e: { data: number }) => setPlaying(e.data === 1),
        },
      });
    });

    return () => {
      cancelled = true;
      playerReadyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [youtubeId, applyDuration]);

  /* --- controls ----------------------------------------------------------- */
  const play = useCallback(() => {
    if (isYouTube) {
      if (playerReadyRef.current) playerRef.current?.playVideo();
    } else void videoElRef.current?.play();
    setPlaying(true);
  }, [isYouTube]);

  const pause = useCallback(() => {
    if (isYouTube) {
      if (playerReadyRef.current) playerRef.current?.pauseVideo();
    } else videoElRef.current?.pause();
    setPlaying(false);
  }, [isYouTube]);

  const seekTo = useCallback(
    (seconds: number) => {
      const max = durationRef.current;
      const clamped = Math.max(0, max ? Math.min(max, seconds) : seconds);
      if (isYouTube) {
        if (playerReadyRef.current) playerRef.current?.seekTo(clamped, true);
      } else if (videoElRef.current) videoElRef.current.currentTime = clamped;
      floatTimeRef.current = clamped;
      setCurrentTime(Math.floor(clamped));
    },
    [isYouTube]
  );

  const setRate = useCallback(
    (rate: number) => {
      if (isYouTube) {
        if (playerReadyRef.current) playerRef.current?.setPlaybackRate(rate);
      } else if (videoElRef.current) videoElRef.current.playbackRate = rate;
      setSpeed(rate);
    },
    [isYouTube]
  );

  /**
   * Team notes deep-link to a moment, so `initialTime` changes while this
   * component stays mounted — clicking a second note for the same video must
   * move the playhead, not just the URL.
   */
  useEffect(() => {
    startAtRef.current = initialTime;
    if (initialTime > 0) seekTo(initialTime);
  }, [initialTime, seekTo]);

  const syncTime = useCallback(() => {
    const t = isYouTube
      ? playerReadyRef.current
        ? playerRef.current?.getCurrentTime()
        : undefined
      : videoElRef.current?.currentTime;
    if (typeof t !== "number" || Number.isNaN(t)) return;
    floatTimeRef.current = t;
    const floored = Math.floor(t);
    setCurrentTime((prev) => (prev === floored ? prev : floored));
  }, [isYouTube]);

  const onLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      applyDuration(event.currentTarget.duration);
      if (startAtRef.current > 0) event.currentTarget.currentTime = startAtRef.current;
    },
    [applyDuration]
  );

  const onPlay = useCallback(() => setPlaying(true), []);
  const onPause = useCallback(() => setPlaying(false), []);

  return {
    isYouTube,
    playerHostRef,
    videoElRef,
    floatTimeRef,
    currentTime,
    duration,
    playing,
    speed,
    play,
    pause,
    seekTo,
    setRate,
    syncTime,
    nativeVideoProps: { onLoadedMetadata, onPlay, onPause },
  };
}
