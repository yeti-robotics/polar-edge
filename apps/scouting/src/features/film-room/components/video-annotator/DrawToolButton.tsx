"use client";

import { cn } from "@repo/ui/lib/utils";
import {
  ArrowUpRightIcon,
  CircleIcon,
  ClipboardPenIcon,
  MinusIcon,
  PencilIcon,
  SquareIcon,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AnnotationTool } from "../../types";
import { HOLD_MS } from "./constants";

const TOOLS: { value: AnnotationTool; label: string; icon: React.ReactNode }[] = [
  { value: "pen", label: "Pencil", icon: <PencilIcon className="size-[22px]" /> },
  { value: "ellipse", label: "Circle", icon: <CircleIcon className="size-[22px]" /> },
  { value: "rect", label: "Box", icon: <SquareIcon className="size-[22px]" /> },
  { value: "line", label: "Line", icon: <MinusIcon className="size-[22px]" /> },
  { value: "arrow", label: "Arrow", icon: <ArrowUpRightIcon className="size-[22px]" /> },
];

const RING_RADIUS = 92;
const PETAL_SIZE = 60;
/** The selected tool's petal is drawn slightly larger. */
const PETAL_SCALE = 1.12;
/** How far the open ring reaches from the node centre, in px. */
const RING_EXTENT = RING_RADIUS + (PETAL_SIZE * PETAL_SCALE) / 2;

/** Fractions of the stage, so the button survives a resize. */
export interface FabPosition {
  fx: number;
  fy: number;
}

interface DrawToolButtonProps {
  /** Bounds the button is dragged within. */
  stageRef: RefObject<HTMLDivElement | null>;
  position: FabPosition;
  onPositionChange: (position: FabPosition) => void;
  tool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  verdictColor: string;
  onToggleVerdict: () => void;
}

/**
 * The draw control, draggable anywhere on the stage. A tap flips the verdict
 * between Good and Bad; a hold opens or closes the ring of tools around it.
 * Only another hold closes the ring, never a stroke or a pick.
 */
export function DrawToolButton({
  stageRef,
  position,
  onPositionChange,
  tool,
  onToolChange,
  verdictColor,
  onToggleVerdict,
}: DrawToolButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const dragRef = useRef<{ x: number; y: number; fx: number; fy: number; moved: boolean } | null>(
    null
  );
  const holdTimerRef = useRef<number | null>(null);
  const heldRef = useRef(false);

  useEffect(
    () => () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    },
    []
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    setHover(false);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      fx: position.fx,
      fy: position.fy,
      moved: false,
    };
    heldRef.current = false;
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      if (!dragRef.current || dragRef.current.moved) return;
      heldRef.current = true;
      setMenuOpen((v) => !v);
    }, HOLD_MS);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 6) {
      drag.moved = true;
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    }
    if (!drag.moved) return;
    // Keep the whole open ring on-screen, so every tool stays tappable
    const mx = Math.min(0.45, RING_EXTENT / rect.width);
    const my = Math.min(0.45, RING_EXTENT / rect.height);
    onPositionChange({
      fx: Math.max(mx, Math.min(1 - mx, drag.fx + dx / rect.width)),
      fy: Math.max(my, Math.min(1 - my, drag.fy + dy / rect.height)),
    });
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    const moved = dragRef.current?.moved;
    const held = heldRef.current;
    dragRef.current = null;
    heldRef.current = false;
    // Released before the hold fired and didn't drag: that's a tap
    if (!moved && !held) onToggleVerdict();
  };

  // Tools sit on a full circle concentric with the draw button
  const petals = useMemo(() => {
    // Hovering the closed node ghosts the ring in as an inert preview
    const preview = !menuOpen && hover;
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
  }, [menuOpen, hover, tool]);

  return (
    <div
      className="absolute z-20 size-0"
      style={{ left: `${position.fx * 100}%`, top: `${position.fy * 100}%` }}
    >
      {petals.map((p) => (
        <button
          key={p.key}
          type="button"
          title={p.label}
          onClick={() => onToolChange(p.key)}
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        // Finger taps fire fake hover events on iPad, so only preview for mouse and Pencil
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") setHover(true);
        }}
        onPointerLeave={() => setHover(false)}
        className="absolute -top-10 -left-10 flex size-20 touch-none items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: verdictColor }}
      >
        <ClipboardPenIcon className="size-[30px]" />
      </button>
    </div>
  );
}
