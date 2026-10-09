"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

interface YTPlayerOptions {
  videoId: string;
  playerVars: Record<string, number>;
  events: {
    onReady: (event: { target: YTPlayer }) => void;
    onStateChange: (event: { data: number }) => void;
  };
}

declare global {
  interface Window {
    YT?: { Player: new (host: HTMLElement, options: YTPlayerOptions) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
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

export interface VideoPlayer {
  /** Host div the IFrame player replaces. */
  playerHostRef: RefObject<HTMLDivElement | null>;
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
}

export function useVideoPlayer(youtubeId: string, initialTime: number): VideoPlayer {
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  // The player's methods only exist once onReady has fired
  const playerReadyRef = useRef(false);
  const floatTimeRef = useRef(0);
  // Mirrors `duration` so `seekTo` can clamp without a changing identity
  const durationRef = useRef(0);
  // Where a player that isn't ready yet should start
  const startAtRef = useRef(initialTime);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      const host = playerHostRef.current;
      if (cancelled || !host || !window.YT) return;

      playerRef.current = new window.YT.Player(host, {
        videoId: youtubeId,
        // No native controls: the annotator owns the chrome and the gestures
        playerVars: { modestbranding: 1, rel: 0, playsinline: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: (e) => {
            playerReadyRef.current = true;
            // Live recordings can report no duration until playback starts
            const seconds = e.target.getDuration();
            const safe = Number.isFinite(seconds) ? seconds : 0;
            durationRef.current = safe;
            setDuration(safe);
            e.target.seekTo(startAtRef.current, true);
          },
          onStateChange: (e) => setPlaying(e.data === 1),
        },
      });
    });

    return () => {
      cancelled = true;
      playerReadyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [youtubeId]);

  const play = useCallback(() => {
    if (playerReadyRef.current) playerRef.current?.playVideo();
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    if (playerReadyRef.current) playerRef.current?.pauseVideo();
    setPlaying(false);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const max = durationRef.current;
    const clamped = Math.max(0, max ? Math.min(max, seconds) : seconds);
    if (playerReadyRef.current) playerRef.current?.seekTo(clamped, true);
    floatTimeRef.current = clamped;
    setCurrentTime(Math.floor(clamped));
  }, []);

  const setRate = useCallback((rate: number) => {
    if (playerReadyRef.current) playerRef.current?.setPlaybackRate(rate);
    setSpeed(rate);
  }, []);

  // Team notes deep-link to a moment, so `initialTime` changes while this stays
  // mounted: clicking a second note for the same video has to move the
  // playhead. 0 counts, for a note on the very start of the match.
  useEffect(() => {
    startAtRef.current = initialTime;
    seekTo(initialTime);
  }, [initialTime, seekTo]);

  const syncTime = useCallback(() => {
    if (!playerReadyRef.current) return;
    const t = playerRef.current?.getCurrentTime();
    if (typeof t !== "number" || Number.isNaN(t)) return;
    floatTimeRef.current = t;
    const floored = Math.floor(t);
    setCurrentTime((prev) => (prev === floored ? prev : floored));
  }, []);

  return {
    playerHostRef,
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
  };
}
