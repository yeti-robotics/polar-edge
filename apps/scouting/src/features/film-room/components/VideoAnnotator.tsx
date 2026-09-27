"use client";

/**
 * VideoAnnotator — FRC match strategy review, iPad first. Polar Edge "Film Room".
 *
 * Interaction model (matches the reviewed mock, Film Room v6):
 *
 *  - Two explicit modes, toggled from an always-visible title-bar pill, so
 *    nothing is ambiguous under competition stress. (The state keys are
 *    "draft"/"final"; the UI calls them Edit and View.)
 *      View  — playback only. Double-tap left/right skips 10s, press-and-hold
 *               left/right runs 0.5x / 2x, a tap in the middle toggles play.
 *               The draw button is hidden entirely. Tapping a mark shows a
 *               read-only popover with its note.
 *      Edit  — drawing only. The footage is always live to draw on, and the
 *               skip/scrub/speed gestures are switched off. The mode pill never
 *               fades, because in Edit mode nothing else wakes the chrome.
 *  - One draw button, draggable anywhere, present only in Edit mode:
 *      tap  -> flips the verdict between Good and Bad
 *      hold -> opens/closes a full ring of tools around it
 *    The ring closes only on another hold — never on a stroke, never on a pick.
 *  - A mark's COLOUR IS ITS VERDICT: green for good, red for bad. There is no
 *    colour palette and no thickness control.
 *  - Finishing a stroke pops the sidebar out with a note composer: Good/Bad,
 *    which team it is about, a note, and one large Save bar.
 *  - Marks autosave: "Save mark", the trash can and Undo each call straight
 *    through to `onSaveMark` / `onDeleteMark`. There is no separate save step.
 *
 * Geometry is stored as normalized 0..1 fractions, never pixels, so a mark
 * drawn on the iPad lines up on a laptop or a projector.
 *
 * YouTube playback uses the IFrame Player API directly — no new dependency in
 * apps/scouting. Uploaded clips play through a native <video>.
 */

import { Button } from "@repo/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  CircleIcon,
  ClipboardPenIcon,
  EyeIcon,
  MinusIcon,
  PanelRightIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  SquareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
  Undo2Icon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { distanceToAnnotation, formatVideoTime as formatTime, isAnnotationVisible } from "../logic";
import {
  type Annotation,
  type AnnotationTool,
  type AnnotationVerdict,
  colorForVerdict,
  type FilmRoomTeamOption,
  type PlayableSource,
  type Point,
  VERDICT_COLORS,
} from "../types";

/* -------------------------------------------------------------------------- */
/* Config                                                                      */
/* -------------------------------------------------------------------------- */

const TOOLS: { value: AnnotationTool; label: string; icon: React.ReactNode }[] = [
  { value: "pen", label: "Pencil", icon: <PencilIcon className="size-[22px]" /> },
  { value: "ellipse", label: "Circle", icon: <CircleIcon className="size-[22px]" /> },
  { value: "rect", label: "Box", icon: <SquareIcon className="size-[22px]" /> },
  { value: "line", label: "Line", icon: <MinusIcon className="size-[22px]" /> },
  { value: "arrow", label: "Arrow", icon: <ArrowUpRightIcon className="size-[22px]" /> },
];

/** One fixed stroke weight — the thickness control was removed by design. */
const LINE_WIDTH = 4;
/** Every mark lives this long; there is no length control in the UI. */
const CLIP_SECONDS = 6;
/** Seconds a mark takes to fade out at the end of its clip. */
const FADE_SECONDS = 0.4;
/** Tap distance (normalized) that counts as "on" a mark. */
const HIT_RADIUS = 0.03;
const DOUBLE_TAP_MS = 300;
/** Press-and-hold threshold, shared by the speed zones and the draw button. */
const HOLD_MS = 380;
const SKIP_SECONDS = 10;
const DRAWER_WIDTH = 360;
/** Chrome fades to nothing after this long untouched, playing or paused. */
const CHROME_IDLE_MS = 3000;
/** Radius of the tool ring around the draw button. */
const RING_RADIUS = 92;
/** Diameter of each ring petal. */
const PETAL_SIZE = 60;
/** The selected tool's petal is drawn slightly larger. */
const PETAL_SCALE = 1.12;
/** How far the open ring reaches from the node centre, in px (widest petal). */
const RING_EXTENT = RING_RADIUS + (PETAL_SIZE * PETAL_SCALE) / 2;

type Mode = "draft" | "final";

/* -------------------------------------------------------------------------- */
/* Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface VideoAnnotatorProps {
  source: PlayableSource;
  /** Shown top-left, e.g. "Qual 42". */
  title: string;
  /** Rows loaded from Postgres for this video. */
  initialAnnotations?: Annotation[];
  /** Teams the composer offers; the first is preselected until one is used. */
  teams?: FilmRoomTeamOption[];
  /** Start here (seconds), e.g. from a team-page deep link. */
  initialTime?: number;
  /** Surfaces the offline pill when the iPad is off the venue wifi. */
  offline?: boolean;
  /** Autosave for one mark (create, edit, or undo a delete). */
  onSaveMark?: (annotation: Annotation) => void;
  onDeleteMark?: (id: string) => void;
  /** The back chevron in the title bar. */
  onBack?: () => void;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* YouTube helpers                                                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Canvas helpers (normalized points in, pixels out)                           */
/* -------------------------------------------------------------------------- */

function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  shape: { type: AnnotationTool; points: Point[]; color: string },
  width: number,
  height: number,
  alpha = 1
) {
  const { type, points, color } = shape;
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Keep strokes legible over bright field lighting.
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 3;

  const x0 = first.x * width;
  const y0 = first.y * height;
  const x1 = last.x * width;
  const y1 = last.y * height;

  if (type === "pen") {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    // Quadratic midpoint smoothing keeps freehand strokes from looking jagged.
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const n = points[i + 1];
      if (!p || !n) continue;
      const cx = p.x * width;
      const cy = p.y * height;
      const nx = n.x * width;
      const ny = n.y * height;
      ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
    }
    ctx.lineTo(x1, y1);
    ctx.stroke();
  } else if (type === "line" || type === "arrow") {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    if (type === "arrow") {
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const head = 14;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 - head * Math.cos(angle - Math.PI / 7),
        y1 - head * Math.sin(angle - Math.PI / 7)
      );
      ctx.lineTo(
        x1 - head * Math.cos(angle + Math.PI / 7),
        y1 - head * Math.sin(angle + Math.PI / 7)
      );
      ctx.closePath();
      ctx.fill();
    }
  } else if (type === "rect") {
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  } else if (type === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      Math.abs(x1 - x0) / 2,
      Math.abs(y1 - y0) / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.restore();
}

/** Opaque on arrival, eased out over the last FADE_SECONDS of its clip. */
function alphaFor(annotation: Annotation, time: number): number {
  const start = annotation.timestamp;
  const end = start + (annotation.durationSeconds || CLIP_SECONDS);
  if (time < start || time >= end) return 0;
  return Math.max(0, Math.min(1, (end - time) / FADE_SECONDS));
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

interface PendingMark {
  /** Set when editing an existing row rather than creating one. */
  editingId: string | null;
  timestamp: number;
  type: AnnotationTool;
  points: Point[];
}

interface MarkPopover {
  x: number;
  y: number;
  verdict?: AnnotationVerdict | null;
  teamNumber?: number | null;
  note?: string | null;
}

export function VideoAnnotator({
  source,
  title,
  initialAnnotations = [],
  teams = [],
  initialTime = 0,
  offline = false,
  onSaveMark,
  onDeleteMark,
  onBack,
  className,
}: VideoAnnotatorProps) {
  /* --- refs ------------------------------------------------------------- */
  const stageRef = useRef<HTMLDivElement>(null);
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  /** The IFrame player's methods only exist once onReady has fired. */
  const playerReadyRef = useRef(false);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  /** Float playback time, for sub-second fades. */
  const floatTimeRef = useRef(0);
  const redrawRef = useRef<() => void>(() => {});
  /** In-progress stroke, kept in a ref so pointermove doesn't re-render. */
  const draftRef = useRef<Point[] | null>(null);
  const isDrawingRef = useRef(false);
  const lastZoneTapRef = useRef<{ side: string; at: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const swipeRef = useRef<{ x: number; open: boolean } | null>(null);
  const fabDragRef = useRef<{
    x: number;
    y: number;
    fx: number;
    fy: number;
    moved: boolean;
  } | null>(null);
  const fabHoldTimerRef = useRef<number | null>(null);
  const fabHeldRef = useRef(false);

  /* --- state ------------------------------------------------------------ */
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [mode, setMode] = useState<Mode>("final");
  const [menuOpen, setMenuOpen] = useState(false);
  const [fabHover, setFabHover] = useState(false);
  /** Draw button position, as fractions of the stage so it survives resizes. */
  const [fab, setFab] = useState({ fx: 0.84, fy: 0.74 });
  const [tool, setTool] = useState<AnnotationTool>("pen");
  /** Current verdict — also the colour every new stroke is drawn in. */
  const [verdict, setVerdict] = useState<AnnotationVerdict>("bad");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [flash, setFlash] = useState<"back" | "fwd" | null>(null);
  const [chromeAwake, setChromeAwake] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDrag, setDrawerDrag] = useState<number | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Annotation | null>(null);
  const [popover, setPopover] = useState<MarkPopover | null>(null);
  // Composer for the mark just drawn
  const [pending, setPending] = useState<PendingMark | null>(null);
  const [pendingVerdict, setPendingVerdict] = useState<AnnotationVerdict | null>(null);
  const [pendingTeam, setPendingTeam] = useState("none");
  const [pendingNote, setPendingNote] = useState("");
  /** Auto-selects the team from the previous mark — you watch one robot at a time. */
  const [lastTeam, setLastTeam] = useState<string | null>(null);

  const isYouTube = source.kind === "youtube";
  const youtubeId = isYouTube ? source.value : null;
  const verdictColor = colorForVerdict(verdict);

  /* --- chrome idle timer -------------------------------------------------- */
  const wakeChrome = useCallback(() => {
    setChromeAwake(true);
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    // Fades out whether playing or paused, per the reviewed design.
    idleTimerRef.current = window.setTimeout(() => setChromeAwake(false), CHROME_IDLE_MS);
  }, []);

  useEffect(() => {
    wakeChrome();
  }, [wakeChrome]);

  /* --- player ------------------------------------------------------------ */
  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !playerHostRef.current) return;
      // biome-ignore lint/suspicious/noExplicitAny: YT global is untyped
      const YT = (window as any).YT;

      playerRef.current = new YT.Player(playerHostRef.current, {
        videoId: youtubeId,
        // No native controls: this component owns the chrome and the gestures.
        playerVars: { modestbranding: 1, rel: 0, playsinline: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            playerReadyRef.current = true;
            setDuration(e.target.getDuration());
            if (initialTime > 0) e.target.seekTo(initialTime, true);
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
    // initialTime only matters for the first load of a video.
  }, [youtubeId]);

  /** One loop: float clock for fades, whole seconds for labels, redraw. */
  useEffect(() => {
    const tick = () => {
      const t = isYouTube
        ? playerReadyRef.current
          ? playerRef.current?.getCurrentTime()
          : undefined
        : videoElRef.current?.currentTime;
      if (typeof t === "number") {
        floatTimeRef.current = t;
        const floored = Math.floor(t);
        setCurrentTime((prev) => (prev === floored ? prev : floored));
      }
      redrawRef.current();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isYouTube]);

  useEffect(
    () => () => {
      for (const timer of [
        holdTimerRef,
        toastTimerRef,
        flashTimerRef,
        idleTimerRef,
        fabHoldTimerRef,
      ]) {
        if (timer.current !== null) window.clearTimeout(timer.current);
      }
    },
    []
  );

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
      const clamped = Math.max(0, duration ? Math.min(duration, seconds) : seconds);
      if (isYouTube) {
        if (playerReadyRef.current) playerRef.current?.seekTo(clamped, true);
      } else if (videoElRef.current) videoElRef.current.currentTime = clamped;
      floatTimeRef.current = clamped;
      setCurrentTime(Math.floor(clamped));
    },
    [duration, isYouTube]
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

  /* --- annotations at the current second --------------------------------- */
  const visibleAnnotations = useMemo(
    () =>
      annotations.filter((a) =>
        isAnnotationVisible(
          { ...a, durationSeconds: a.durationSeconds || CLIP_SECONDS },
          currentTime
        )
      ),
    [annotations, currentTime]
  );

  /* --- canvas ------------------------------------------------------------ */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    if (!width) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const t = floatTimeRef.current;
    for (const annotation of annotations) {
      // The row being edited is drawn from the composer instead, at full alpha.
      if (pending?.editingId === annotation.id) continue;
      drawAnnotation(
        ctx,
        {
          type: annotation.type,
          points: annotation.points,
          color: colorForVerdict(annotation.verdict),
        },
        width,
        height,
        alphaFor(annotation, t)
      );
    }
    if (pending) {
      drawAnnotation(
        ctx,
        { type: pending.type, points: pending.points, color: colorForVerdict(pendingVerdict) },
        width,
        height
      );
    }
    if (draftRef.current?.length) {
      drawAnnotation(
        ctx,
        { type: tool, points: draftRef.current, color: verdictColor },
        width,
        height
      );
    }
  }, [annotations, pending, pendingVerdict, tool, verdictColor]);

  useEffect(() => {
    redrawRef.current = redraw;
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => redraw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  /* --- helpers ----------------------------------------------------------- */
  const normalize = useCallback((event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      // Clamp so a drag that leaves the frame still stores a valid fraction.
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }, []);

  const hitTest = useCallback(
    (point: Point): Annotation | null => {
      let target: Annotation | null = null;
      let best = HIT_RADIUS;
      for (const a of visibleAnnotations) {
        const d = distanceToAnnotation(a, point);
        if (d <= best) {
          best = d;
          target = a;
        }
      }
      return target;
    },
    [visibleAnnotations]
  );

  /** Delete with a 5s undo window — you are usually moving fast. */
  const removeAnnotation = useCallback(
    (target: Annotation) => {
      onDeleteMark?.(target.id);
      setAnnotations((prev) => prev.filter((a) => a.id !== target.id));
      setPending((prev) => (prev?.editingId === target.id ? null : prev));
      setLastDeleted(target);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setLastDeleted(null), 5000);
    },
    [onDeleteMark]
  );

  const flashSkip = useCallback((side: "back" | "fwd") => {
    setFlash(side);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 550);
  }, []);

  /** Stroke finished -> sidebar pops out with the composer. */
  const openComposer = useCallback(
    (points: Point[], type: AnnotationTool, teamOverride?: string) => {
      pause();
      setPending({ editingId: null, timestamp: Math.floor(floatTimeRef.current), type, points });
      setPendingVerdict(verdict);
      setPendingTeam(teamOverride ?? lastTeam ?? (teams[0] ? String(teams[0].teamNumber) : "none"));
      setPendingNote("");
      setDrawerOpen(true);
    },
    [lastTeam, pause, teams, verdict]
  );

  const openEditor = useCallback(
    (a: Annotation) => {
      // Park the footage on the mark so the drawing is in context.
      pause();
      seekTo(a.timestamp);
      setPending({ editingId: a.id, timestamp: a.timestamp, type: a.type, points: a.points });
      setPendingVerdict(a.verdict ?? null);
      setPendingTeam(a.teamNumber ? String(a.teamNumber) : "none");
      setPendingNote(a.note ?? "");
      setDrawerOpen(true);
    },
    [pause, seekTo]
  );

  const commitPending = () => {
    if (!pending) return;
    const record: Annotation = {
      id: pending.editingId ?? crypto.randomUUID(),
      timestamp: pending.timestamp,
      durationSeconds: CLIP_SECONDS,
      type: pending.type,
      points: pending.points,
      verdict: pendingVerdict,
      note: pendingNote.trim() || null,
      teamNumber: pendingTeam === "none" ? null : Number(pendingTeam),
    };
    setAnnotations((prev) =>
      pending.editingId
        ? prev.map((a) => (a.id === pending.editingId ? record : a))
        : [...prev, record]
    );
    onSaveMark?.(record);
    setLastTeam(pendingTeam);
    setPending(null);
  };

  /** Shared by every gesture zone: show a mark's note if one is under the finger. */
  const popoverAt = useCallback(
    (event: { clientX: number; clientY: number }): boolean => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return false;
      const point = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
      const target = hitTest(point);
      if (!target) return false;
      setPopover({
        x: point.x,
        y: point.y,
        verdict: target.verdict,
        teamNumber: target.teamNumber,
        note: target.note,
      });
      return true;
    },
    [hitTest]
  );

  /* --- gestures on the footage (View mode only) --------------------------- */
  const handleZoneDown = (event: React.PointerEvent<HTMLDivElement>) => {
    wakeChrome();
    if (popover) {
      setPopover(null);
      return;
    }

    const side = event.currentTarget.dataset.side === "fwd" ? "fwd" : "back";
    const now = Date.now();
    const prev = lastZoneTapRef.current;
    lastZoneTapRef.current = { side, at: now };

    // Double-tap the same side: skip 10s, YouTube-style.
    if (prev && prev.side === side && now - prev.at < DOUBLE_TAP_MS) {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      lastZoneTapRef.current = null;
      seekTo(floatTimeRef.current + (side === "fwd" ? SKIP_SECONDS : -SKIP_SECONDS));
      flashSkip(side);
      return;
    }

    // A single tap also checks whether a mark is under the finger.
    if (popoverAt(event)) return;

    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    // Hold: 2x forward, 0.5x back — released on pointerup.
    holdTimerRef.current = window.setTimeout(() => {
      setRate(side === "fwd" ? 2 : 0.5);
      play();
    }, HOLD_MS);
  };

  const handleZoneUp = () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    if (speed !== 1) setRate(1);
  };

  const handleCenterTap = (event: React.PointerEvent<HTMLButtonElement>) => {
    wakeChrome();
    if (popover) {
      setPopover(null);
      return;
    }
    // Marks in the middle strip are tappable too, not just the side zones.
    if (popoverAt(event)) return;
    if (playing) pause();
    else play();
  };

  /* --- draw button + tool ring -------------------------------------------- */
  const handleFabDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    setFabHover(false);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // synthetic events / unsupported pointer ids
    }
    fabDragRef.current = {
      x: event.clientX,
      y: event.clientY,
      fx: fab.fx,
      fy: fab.fy,
      moved: false,
    };
    fabHeldRef.current = false;
    if (fabHoldTimerRef.current !== null) window.clearTimeout(fabHoldTimerRef.current);
    // A genuine hold toggles the ring; a quick tap never does.
    fabHoldTimerRef.current = window.setTimeout(() => {
      if (!fabDragRef.current || fabDragRef.current.moved) return;
      fabHeldRef.current = true;
      setMenuOpen((v) => !v);
    }, HOLD_MS);
  };

  const handleFabMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = fabDragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 6) {
      drag.moved = true;
      if (fabHoldTimerRef.current !== null) window.clearTimeout(fabHoldTimerRef.current);
    }
    if (!drag.moved) return;
    // Keep the whole open ring on-screen, so every tool stays tappable.
    const mx = Math.min(0.45, RING_EXTENT / rect.width);
    const my = Math.min(0.45, RING_EXTENT / rect.height);
    setFab({
      fx: Math.max(mx, Math.min(1 - mx, drag.fx + dx / rect.width)),
      fy: Math.max(my, Math.min(1 - my, drag.fy + dy / rect.height)),
    });
  };

  const handleFabUp = () => {
    if (fabHoldTimerRef.current !== null) window.clearTimeout(fabHoldTimerRef.current);
    const moved = fabDragRef.current?.moved;
    const held = fabHeldRef.current;
    fabDragRef.current = null;
    fabHeldRef.current = false;
    // Released before the hold fired and didn't drag -> that's a tap: flip verdict.
    if (!moved && !held) setVerdict((v) => (v === "good" ? "bad" : "good"));
  };

  /** Tools sit on a full circle concentric with the draw button. */
  const petals = useMemo(() => {
    // Hovering the closed node ghosts the ring in as an inert preview.
    const preview = !menuOpen && fabHover;
    if (!menuOpen && !preview) return [];
    return TOOLS.map((t, i) => {
      const angle = (i / TOOLS.length) * Math.PI * 2 - Math.PI / 2;
      return {
        key: t.value,
        label: t.label,
        icon: t.icon,
        active: tool === t.value,
        preview,
        left: Math.cos(angle) * RING_RADIUS - PETAL_SIZE / 2,
        top: Math.sin(angle) * RING_RADIUS - PETAL_SIZE / 2,
      };
    });
  }, [menuOpen, fabHover, tool]);

  /* --- drawing handlers (Edit mode only) ---------------------------------- */
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = normalize(event);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // synthetic events / unsupported pointer ids
    }
    // The ring stays open through the stroke; only a hold closes it.
    isDrawingRef.current = true;
    draftRef.current = [point];
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !draftRef.current) return;
    const point = normalize(event);
    if (tool === "pen") draftRef.current.push(point);
    // Shapes only ever keep [start, current].
    else draftRef.current = [draftRef.current[0] ?? point, point];
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const points = draftRef.current ?? [];
    draftRef.current = null;
    if (points.length < 2) return;
    // Each stroke is its own mark: auto-save the open one with whatever was
    // typed, then open the note box for the new stroke.
    if (pending) {
      commitPending();
      openComposer(points, tool, pendingTeam);
      return;
    }
    openComposer(points, tool);
  };

  /* --- drawer swipe -------------------------------------------------------- */
  const onSwipeStart = (event: React.PointerEvent) => {
    swipeRef.current = { x: event.clientX, open: drawerOpen };
  };

  const onSwipeMove = (event: React.PointerEvent) => {
    const swipe = swipeRef.current;
    if (!swipe) return;
    const delta = swipe.x - event.clientX;
    const base = swipe.open ? DRAWER_WIDTH : 0;
    setDrawerDrag(Math.min(DRAWER_WIDTH, Math.max(0, base + delta)));
  };

  const onSwipeEnd = () => {
    if (drawerDrag !== null) setDrawerOpen(drawerDrag > DRAWER_WIDTH / 2);
    swipeRef.current = null;
    setDrawerDrag(null);
  };

  const drawerOffset = drawerDrag ?? (drawerOpen ? DRAWER_WIDTH : 0);

  /* --- render -------------------------------------------------------------- */
  return (
    <div
      ref={stageRef}
      className={cn(
        "relative size-full overflow-hidden bg-black text-white select-none",
        className
      )}
    >
      {offline && (
        <div className="absolute top-3 left-3 z-40 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1.5 text-xs">
          <WifiOffIcon className="size-3.5" />
          Offline
        </div>
      )}

      {/* Stage: the drawer slides it left */}
      <div
        className="absolute inset-0 ease-out"
        style={{
          transform: `translateX(-${drawerOffset}px)`,
          transition: drawerDrag === null ? "transform 220ms" : "none",
        }}
      >
        {isYouTube ? (
          <div className="pointer-events-none absolute inset-0">
            <div ref={playerHostRef} className="size-full" />
          </div>
        ) : (
          // biome-ignore lint/a11y/useMediaCaption: user-supplied match footage
          <video
            ref={videoElRef}
            src={source.value}
            playsInline
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              // Some recorders write no duration (Infinity) into the file.
              setDuration(Number.isFinite(d) ? d : 0);
              if (initialTime > 0) e.currentTarget.currentTime = initialTime;
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="absolute inset-0 size-full object-contain"
          />
        )}

        {/* View mode: playback gestures. Switched off entirely in Edit. */}
        {mode === "final" && (
          <>
            <div
              data-side="back"
              onPointerDown={handleZoneDown}
              onPointerUp={handleZoneUp}
              onPointerLeave={handleZoneUp}
              className="absolute inset-y-0 left-0 z-[5] w-[42%] touch-none"
            />
            <div
              data-side="fwd"
              onPointerDown={handleZoneDown}
              onPointerUp={handleZoneUp}
              onPointerLeave={handleZoneUp}
              className="absolute inset-y-0 right-0 z-[5] w-[42%] touch-none"
            />
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              onPointerDown={handleCenterTap}
              className="absolute inset-y-0 right-[42%] left-[42%] z-[5]"
            />
          </>
        )}

        {/* Edit mode: the footage is always live to draw on. */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={cn(
            "absolute top-0 left-0 z-[6] h-full w-full touch-none",
            mode === "draft" ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
          )}
        />

        {/* Skip / speed feedback */}
        {flash === "back" && (
          <div className="pointer-events-none absolute top-1/2 left-[16%] z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/55 px-5 py-3.5 text-base font-medium">
            <RotateCcwIcon className="size-5" />
            {SKIP_SECONDS}s
          </div>
        )}
        {flash === "fwd" && (
          <div className="pointer-events-none absolute top-1/2 right-[16%] z-10 flex translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/55 px-5 py-3.5 text-base font-medium">
            {SKIP_SECONDS}s
            <RotateCwIcon className="size-5" />
          </div>
        )}
        {speed !== 1 && (
          <div className="pointer-events-none absolute top-22 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full bg-black/65 px-4 py-2 text-[15px] font-semibold">
            {speed}×
          </div>
        )}

        {/* Read-only popover for a tapped mark */}
        {popover && (
          <>
            <button
              type="button"
              aria-label="Dismiss"
              className="absolute inset-0 z-20 cursor-default"
              onClick={() => setPopover(null)}
            />
            <div
              className="absolute z-30 flex w-65 flex-col gap-1.5 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg"
              style={{
                // Centred under the finger, clamped so it never leaves the frame.
                left: `clamp(8px, calc(${popover.x * 100}% - 130px), calc(100% - 268px))`,
                top: `clamp(8px, calc(${popover.y * 100}% + 16px), calc(100% - 140px))`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: colorForVerdict(popover.verdict) }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: colorForVerdict(popover.verdict) }}
                >
                  {popover.teamNumber ? `Team ${popover.teamNumber}` : "No team"}
                </span>
                {popover.verdict && (
                  <span className="ml-auto text-xs font-semibold tracking-wide text-muted-foreground">
                    {popover.verdict.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-[13px] leading-snug">{popover.note || "No note."}</p>
            </div>
          </>
        )}

        {/* Mode pill lives OUTSIDE the fading chrome: it never hides, in either
            mode, because in Edit mode nothing else can wake the bar. */}
        <div className="absolute top-4 right-4.5 z-40">
          <Button
            type="button"
            size="lg"
            className={cn(
              "h-11 rounded-full px-4 text-white shadow-lg",
              mode === "draft" ? "bg-primary hover:bg-primary/90" : "bg-black/50 hover:bg-black/70"
            )}
            onClick={() => {
              setMode((m) => (m === "draft" ? "final" : "draft"));
              setMenuOpen(false);
              setPopover(null);
            }}
          >
            {mode === "draft" ? <PencilIcon className="size-4" /> : <EyeIcon className="size-4" />}
            {mode === "draft" ? "Edit" : "View"}
          </Button>
        </div>

        {/* Title bar — fades out after CHROME_IDLE_MS, wakes on any tap */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent py-4 pr-33.5 pl-4.5 transition-opacity duration-250",
            chromeAwake ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <div className={cn("flex min-w-0 items-center gap-2.5", offline && "ml-[108px]")}>
            {onBack && (
              <Button
                type="button"
                size="icon-lg"
                aria-label="Back to Film Room"
                className="size-10 shrink-0 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={onBack}
              >
                <ChevronLeftIcon className="size-5" />
              </Button>
            )}
            <div className="truncate text-lg font-semibold">{title}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon-lg"
              aria-label="Notes"
              className="size-11 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={() => setDrawerOpen((v) => !v)}
            >
              <PanelRightIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Transport — plain bar, no per-mark colour pips */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 bg-gradient-to-t from-black/75 to-transparent px-3.5 pb-3.5 transition-opacity duration-250",
            chromeAwake ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <button
            type="button"
            aria-label="Scrub"
            className="relative h-5 w-full"
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo(((e.clientX - rect.left) / rect.width) * duration);
            }}
          >
            <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/28" />
            <span
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
            <span
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              style={{ left: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
          </button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="icon-lg"
              variant="ghost"
              aria-label={playing ? "Pause" : "Play"}
              className="size-11 rounded-full text-white hover:bg-white/10"
              onClick={() => (playing ? pause() : play())}
            >
              {playing ? (
                <PauseIcon className="size-[22px]" />
              ) : (
                <PlayIcon className="size-[22px]" />
              )}
            </Button>
            <span className="font-mono text-[13px] text-white/85">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Draw button + tool ring — Edit mode only */}
        {mode === "draft" && (
          <div
            className="absolute z-20 size-0"
            style={{ left: `${fab.fx * 100}%`, top: `${fab.fy * 100}%` }}
          >
            {petals.map((p) => (
              <button
                key={p.key}
                type="button"
                title={p.label}
                // Picking a tool leaves the ring open by design.
                onClick={() => setTool(p.key)}
                className={cn(
                  "absolute flex items-center justify-center rounded-full border border-white/20 text-white transition-[left,top,transform] duration-150 ease-out",
                  p.active ? "scale-110" : "bg-black/75",
                  p.preview && "pointer-events-none opacity-45"
                )}
                style={{
                  left: p.left,
                  top: p.top,
                  width: PETAL_SIZE,
                  height: PETAL_SIZE,
                  backgroundColor: p.active ? verdictColor : undefined,
                }}
              >
                {p.icon}
              </button>
            ))}
            <button
              type="button"
              title="Tap: Good/Bad · Hold: tools"
              onPointerDown={handleFabDown}
              onPointerMove={handleFabMove}
              onPointerUp={handleFabUp}
              // Finger taps fire fake hover events on iPad; only mouse and Pencil preview.
              onPointerEnter={(e) => {
                if (e.pointerType !== "touch") setFabHover(true);
              }}
              onPointerLeave={() => setFabHover(false)}
              className="absolute -top-10 -left-10 flex size-20 touch-none items-center justify-center rounded-full text-white shadow-lg"
              style={{ backgroundColor: verdictColor }}
            >
              <ClipboardPenIcon className="size-[30px]" />
            </button>
          </div>
        )}
      </div>

      {/* Undo toast */}
      {lastDeleted && (
        <div className="absolute bottom-20 left-4 z-40 flex items-center gap-3 rounded-xl border bg-card p-2.5 text-card-foreground shadow-lg">
          <span className="text-sm">Mark deleted</span>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
              setAnnotations((prev) => [...prev, lastDeleted]);
              onSaveMark?.(lastDeleted);
              setLastDeleted(null);
            }}
          >
            <Undo2Icon className="size-3.5" />
            Undo
          </Button>
        </div>
      )}

      {/* Swipe zone on the right edge */}
      <div
        onPointerDown={onSwipeStart}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeEnd}
        onPointerCancel={onSwipeEnd}
        className="absolute inset-y-0 right-0 z-30 w-6 touch-none"
        style={{ transform: `translateX(-${drawerOffset}px)` }}
      >
        <span className="absolute top-1/2 right-1 h-16 w-1 -translate-y-1/2 rounded-full bg-white/30" />
      </div>

      {/* Sidebar: composer pops out here after a mark is drawn */}
      <aside
        className="absolute inset-y-0 right-0 z-25 box-border flex w-[360px] flex-col gap-3 overflow-y-auto border-l bg-background p-3.5 text-foreground ease-out"
        style={{
          transform: `translateX(${DRAWER_WIDTH - drawerOffset}px)`,
          transition: drawerDrag === null ? "transform 220ms" : "none",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {pending
              ? pending.editingId
                ? "Edit mark"
                : "New mark"
              : `Marks (${annotations.length})`}
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Close notes"
            onClick={() => {
              setDrawerOpen(false);
              setPending(null);
            }}
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {pending && (
          <div className="flex flex-col gap-3 rounded-xl border border-primary bg-card p-3">
            <div className="flex items-center gap-2">
              <span
                className="size-3.5 rounded-full"
                style={{ backgroundColor: colorForVerdict(pendingVerdict) }}
              />
              <span
                className="text-[13px] font-semibold"
                style={{ color: colorForVerdict(pendingVerdict) }}
              >
                {pendingVerdict ? pendingVerdict.toUpperCase() : "New mark"}
              </span>
              {/* Discard lives up here next to the colour dot */}
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Discard mark"
                className="ml-auto size-8.5"
                onClick={() => setPending(null)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant={pendingVerdict === "good" ? "default" : "outline"}
                className="h-11 font-semibold"
                style={
                  pendingVerdict === "good"
                    ? { backgroundColor: VERDICT_COLORS.good, color: "#052e16" }
                    : undefined
                }
                onClick={() => setPendingVerdict("good")}
              >
                <ThumbsUpIcon className="size-4" />
                Good
              </Button>
              <Button
                type="button"
                variant={pendingVerdict === "bad" ? "default" : "outline"}
                className="h-11 font-semibold"
                style={
                  pendingVerdict === "bad"
                    ? { backgroundColor: VERDICT_COLORS.bad, color: "#450a0a" }
                    : undefined
                }
                onClick={() => setPendingVerdict("bad")}
              >
                <ThumbsDownIcon className="size-4" />
                Bad
              </Button>
            </div>

            <Select value={pendingTeam} onValueChange={setPendingTeam}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Which team?" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.teamNumber} value={String(t.teamNumber)}>
                    {t.teamNumber}
                  </SelectItem>
                ))}
                <SelectItem value="none">No team</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              value={pendingNote}
              onChange={(e) => setPendingNote(e.target.value)}
              placeholder="What should we do differently here?"
              className="min-h-22 resize-none text-sm"
            />

            {/* One large save target — the only thing you must hit accurately */}
            <Button type="button" className="h-13 text-base font-semibold" onClick={commitPending}>
              <CheckIcon className="size-5" />
              Save mark
            </Button>
          </div>
        )}

        {/* Collapsed list: colour, time, team number coloured by verdict */}
        <ul className="flex flex-col gap-1.5">
          {annotations.length === 0 && !pending && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No marks yet. Switch to Edit and mark up the frame.
            </li>
          )}
          {[...annotations]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((a) => (
              <li key={a.id} className="flex items-center gap-1 rounded-xl border bg-card">
                <button
                  type="button"
                  onClick={() => openEditor(a)}
                  className="flex flex-1 items-center gap-2.5 rounded-xl p-3 text-left hover:bg-accent"
                >
                  <span
                    className="size-3.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorForVerdict(a.verdict) }}
                  />
                  <span className="font-mono text-[13px] text-muted-foreground">
                    {formatTime(a.timestamp)}
                  </span>
                  <span
                    className="ml-auto text-sm font-semibold"
                    style={{ color: a.verdict ? colorForVerdict(a.verdict) : undefined }}
                  >
                    {a.teamNumber ?? "—"}
                  </span>
                </button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete mark"
                  className="mr-1.5"
                  onClick={() => removeAnnotation(a)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            ))}
        </ul>

        <p className="text-xs text-muted-foreground">
          Tap a mark to edit it. In View mode, tap one on the video to read its note.
        </p>
      </aside>
    </div>
  );
}

export default VideoAnnotator;
