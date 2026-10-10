"use client";

/**
 * Two modes, toggled from the pill in the title bar. The state keys are
 * "draft"/"final"; the UI calls them Edit and View.
 *   View - playback only. The draw button is hidden and tapping a mark shows
 *          its note.
 *   Edit - drawing only. The skip/scrub/speed gestures are switched off.
 *
 * A mark's colour is its verdict, so there is no colour or thickness control.
 * Finishing a stroke opens the composer, and saving autosaves through
 * onSaveMark - there is no separate save step.
 */

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { EyeIcon, PencilIcon, WifiOffIcon } from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAnnotationCanvas } from "../../hooks/use-annotation-canvas";
import { useVideoPlayer } from "../../hooks/use-video-player";
import {
  clipSeconds,
  DEFAULT_CLIP_SECONDS,
  distanceToAnnotation,
  isAnnotationVisible,
  pushStrokePoint,
} from "../../logic";
import {
  type Annotation,
  type AnnotationTool,
  type AnnotationVerdict,
  colorForVerdict,
  type FilmRoomTeamOption,
  type Point,
} from "../../types";
import { AnnotationComposer, type ComposerFields } from "./AnnotationComposer";
import { AnnotationPopover, type MarkPopover } from "./AnnotationPopover";
import { DrawToolButton, type FabPosition } from "./DrawToolButton";
import { DRAWER_WIDTH, NotesDrawer } from "./NotesDrawer";
import { PlaybackControls } from "./PlaybackControls";
import { UndoToast } from "./UndoToast";
import { VideoStage } from "./VideoStage";

/** Tap distance, normalized, that counts as "on" a mark. */
const HIT_RADIUS = 0.03;

type Mode = "draft" | "final";

interface PendingMark {
  // Set when editing an existing row rather than creating one
  editingId: string | null;
  timestamp: number;
  type: AnnotationTool;
  points: Point[];
}

export interface VideoAnnotatorProps {
  youtubeId: string;
  title: string;
  initialAnnotations?: Annotation[];
  teams?: FilmRoomTeamOption[];
  /** Seconds to start at, e.g. from a team-page deep link. */
  initialTime?: number;
  offline?: boolean;
  onSaveMark?: (annotation: Annotation) => void;
  onDeleteMark?: (id: string) => void;
  onBack?: () => void;
  className?: string;
}

export function VideoAnnotator({
  youtubeId,
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
  const stageRef = useRef<HTMLDivElement>(null);
  // In-progress stroke, in a ref so pointermove doesn't re-render
  const draftRef = useRef<Point[] | null>(null);
  const isDrawingRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);
  const swipeRef = useRef<{ x: number; open: boolean } | null>(null);

  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [mode, setMode] = useState<Mode>("final");
  const [tool, setTool] = useState<AnnotationTool>("pen");
  // Held here so a trip through View mode doesn't move the button back
  const [fabPosition, setFabPosition] = useState<FabPosition>({ fx: 0.84, fy: 0.74 });
  const [verdict, setVerdict] = useState<AnnotationVerdict>("bad");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDrag, setDrawerDrag] = useState<number | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Annotation | null>(null);
  const [popover, setPopover] = useState<MarkPopover | null>(null);
  const [pending, setPending] = useState<PendingMark | null>(null);
  const [fields, setFields] = useState<ComposerFields>({
    verdict: null,
    team: "none",
    note: "",
    durationSeconds: DEFAULT_CLIP_SECONDS,
  });
  // Carried over to the next mark
  const [lastTeam, setLastTeam] = useState<string | null>(null);
  const [lastDuration, setLastDuration] = useState(DEFAULT_CLIP_SECONDS);

  const verdictColor = colorForVerdict(verdict);
  const player = useVideoPlayer(youtubeId, initialTime);
  const { floatTimeRef, pause, seekTo } = player;

  const { canvasRef } = useAnnotationCanvas({
    annotations,
    pending,
    pendingColor: colorForVerdict(fields.verdict),
    draftRef,
    draftType: tool,
    draftColor: verdictColor,
    timeRef: floatTimeRef,
    onFrame: player.syncTime,
  });

  useEffect(
    () => () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  const patchFields = useCallback(
    (patch: Partial<ComposerFields>) => setFields((prev) => ({ ...prev, ...patch })),
    []
  );

  /* --- marks under the finger --------------------------------------------- */
  const visibleAnnotations = useMemo(
    () => annotations.filter((a) => isAnnotationVisible(a, player.currentTime)),
    [annotations, player.currentTime]
  );

  /** Shows a mark's note if one is under the finger; true when it did. */
  const probeMark = useCallback(
    (event: { clientX: number; clientY: number }): boolean => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return false;
      const point = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };

      let target: Annotation | null = null;
      let best = HIT_RADIUS;
      for (const a of visibleAnnotations) {
        const d = distanceToAnnotation(a, point);
        if (d <= best) {
          best = d;
          target = a;
        }
      }
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
    [visibleAnnotations]
  );

  /* --- composer ------------------------------------------------------------ */
  const openComposer = useCallback(
    (points: Point[], type: AnnotationTool, teamOverride?: string) => {
      pause();
      setPending({ editingId: null, timestamp: Math.floor(floatTimeRef.current), type, points });
      setFields({
        verdict,
        team: teamOverride ?? lastTeam ?? (teams[0] ? String(teams[0].teamNumber) : "none"),
        note: "",
        durationSeconds: lastDuration,
      });
      setDrawerOpen(true);
    },
    [floatTimeRef, lastDuration, lastTeam, pause, teams, verdict]
  );

  const openEditor = useCallback(
    (a: Annotation) => {
      // Park the footage on the mark so the drawing is in context
      pause();
      seekTo(a.timestamp);
      setPending({ editingId: a.id, timestamp: a.timestamp, type: a.type, points: a.points });
      setFields({
        verdict: a.verdict ?? null,
        team: a.teamNumber ? String(a.teamNumber) : "none",
        note: a.note ?? "",
        durationSeconds: clipSeconds(a),
      });
      setDrawerOpen(true);
    },
    [pause, seekTo]
  );

  const commitPending = useCallback(() => {
    if (!pending) return;
    const record: Annotation = {
      id: pending.editingId ?? crypto.randomUUID(),
      timestamp: pending.timestamp,
      durationSeconds: fields.durationSeconds,
      type: pending.type,
      points: pending.points,
      verdict: fields.verdict,
      note: fields.note.trim() || null,
      teamNumber: fields.team === "none" ? null : Number(fields.team),
    };
    setAnnotations((prev) =>
      pending.editingId
        ? prev.map((a) => (a.id === pending.editingId ? record : a))
        : [...prev, record]
    );
    onSaveMark?.(record);
    setLastTeam(fields.team);
    setLastDuration(fields.durationSeconds);
    setPending(null);
  }, [fields, onSaveMark, pending]);

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

  /* --- drawing handlers (Edit mode only) ---------------------------------- */
  const normalize = useCallback((event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      // Clamp so a drag that leaves the frame still stores a valid fraction
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    draftRef.current = [normalize(event)];
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !draftRef.current) return;
    const point = normalize(event);
    if (tool === "pen") pushStrokePoint(draftRef.current, point);
    // Shapes only ever keep [start, current]
    else draftRef.current = [draftRef.current[0] ?? point, point];
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const points = draftRef.current ?? [];
    draftRef.current = null;
    if (points.length < 2) return;
    // Each stroke is its own mark: save the open one with whatever was typed,
    // then open the composer for the new stroke.
    if (pending) {
      commitPending();
      openComposer(points, tool, fields.team);
      return;
    }
    openComposer(points, tool);
  };

  /* --- drawer swipe -------------------------------------------------------- */
  const onSwipeStart = (event: ReactPointerEvent) => {
    swipeRef.current = { x: event.clientX, open: drawerOpen };
  };

  const onSwipeMove = (event: ReactPointerEvent) => {
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
        <VideoStage
          playerHostRef={player.playerHostRef}
          canvasRef={canvasRef}
          drawable={mode === "draft"}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        <PlaybackControls
          player={player}
          title={title}
          offline={offline}
          onBack={onBack}
          onToggleNotes={() => setDrawerOpen((v) => !v)}
          gesturesEnabled={mode === "final"}
          popoverOpen={popover !== null}
          onDismissPopover={() => setPopover(null)}
          onProbeMark={probeMark}
        />

        {popover && <AnnotationPopover popover={popover} onDismiss={() => setPopover(null)} />}

        {/* Outside the fading chrome: in Edit mode nothing else wakes the bar */}
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
              setPopover(null);
            }}
          >
            {mode === "draft" ? <PencilIcon className="size-4" /> : <EyeIcon className="size-4" />}
            {mode === "draft" ? "Edit" : "View"}
          </Button>
        </div>

        {mode === "draft" && (
          <DrawToolButton
            stageRef={stageRef}
            position={fabPosition}
            onPositionChange={setFabPosition}
            tool={tool}
            onToolChange={setTool}
            verdictColor={verdictColor}
            onToggleVerdict={() => setVerdict((v) => (v === "good" ? "bad" : "good"))}
          />
        )}
      </div>

      {lastDeleted && (
        <UndoToast
          onUndo={() => {
            if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
            setAnnotations((prev) => [...prev, lastDeleted]);
            onSaveMark?.(lastDeleted);
            setLastDeleted(null);
          }}
        />
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

      <NotesDrawer
        offset={drawerOffset}
        animated={drawerDrag === null}
        heading={
          pending ? (pending.editingId ? "Edit mark" : "New mark") : `Marks (${annotations.length})`
        }
        onClose={() => {
          setDrawerOpen(false);
          setPending(null);
        }}
        annotations={annotations}
        onEditMark={openEditor}
        onDeleteMark={removeAnnotation}
      >
        {pending && (
          <AnnotationComposer
            fields={fields}
            onChange={patchFields}
            teams={teams}
            onSave={commitPending}
            onDiscard={() => setPending(null)}
          />
        )}
      </NotesDrawer>
    </div>
  );
}

export default VideoAnnotator;
