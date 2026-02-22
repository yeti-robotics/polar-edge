"use client";

import { Button } from "@repo/ui/components/button";
import { Redo2Icon, Trash2Icon, Undo2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import fieldImage from "./2026-field-transparent.png";

export interface PathPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface PathData {
  points: PathPoint[];
}

interface PathCanvasProps {
  onPathChange?: (pathData: PathData) => void;
  initialPathData?: PathData;
  className?: string;
}

export function PathCanvas({ onPathChange, initialPathData, className }: PathCanvasProps) {
  // Always use the official field image
  const fieldImageSrc = typeof fieldImage === "string" ? fieldImage : fieldImage.src;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<PathPoint[]>([]);
  const [pathHistory, setPathHistory] = useState<PathPoint[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

  // Load image to get its aspect ratio
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      setImageAspectRatio(aspectRatio);
    };
    img.src = fieldImageSrc;
  }, [fieldImageSrc]);

  // Initialize canvas size based on container, maintaining aspect ratio
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && imageAspectRatio) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const containerAspectRatio = rect.width / rect.height;

        let width: number;
        let height: number;

        if (containerAspectRatio > imageAspectRatio) {
          // Container is wider, fit to height
          height = rect.height;
          width = height * imageAspectRatio;
        } else {
          // Container is taller, fit to width
          width = rect.width;
          height = width / imageAspectRatio;
        }

        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [imageAspectRatio]);

  // Convert relative coordinates (0-1) to canvas coordinates
  const relativeToCanvas = useCallback(
    (relativePoint: PathPoint): PathPoint => {
      return {
        x: relativePoint.x * canvasSize.width,
        y: relativePoint.y * canvasSize.height,
        timestamp: relativePoint.timestamp,
      };
    },
    [canvasSize]
  );

  // Convert canvas coordinates to relative coordinates (0-1)
  const canvasToRelative = useCallback(
    (canvasPoint: PathPoint): PathPoint => {
      if (canvasSize.width === 0 || canvasSize.height === 0) return canvasPoint;
      return {
        x: canvasPoint.x / canvasSize.width,
        y: canvasPoint.y / canvasSize.height,
        timestamp: canvasPoint.timestamp,
      };
    },
    [canvasSize]
  );

  // Load initial path data and convert from relative to canvas coordinates
  useEffect(() => {
    if (initialPathData && canvasSize.width > 0 && canvasSize.height > 0) {
      // Convert relative coordinates to canvas coordinates for display
      const canvasPoints = initialPathData.points.map(relativeToCanvas);
      setCurrentPath(canvasPoints);
      setPathHistory([canvasPoints]);
      setHistoryIndex(0);
    }
  }, [initialPathData, canvasSize, relativeToCanvas]);

  const drawPath = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (currentPath.length === 0) return;

      const firstPoint = currentPath[0];
      if (!firstPoint) return;

      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Use gradient only when not actively drawing (after path is complete)
      if (!isDrawing && currentPath.length > 1) {
        // Draw path segment by segment with gradient based on temporal order
        for (let i = 0; i < currentPath.length - 1; i++) {
          const currentPoint = currentPath[i];
          const nextPoint = currentPath[i + 1];
          if (!currentPoint || !nextPoint) continue;

          // Calculate color based on temporal position (index) in the path
          const progress = i / (currentPath.length - 1);

          // Three-color gradient: blue -> orange -> pink
          let r: number, g: number, b: number;
          if (progress < 0.5) {
            // Blue to orange
            const t = progress * 2; // 0 to 1
            r = Math.round(59 + (249 - 59) * t); // #3b -> #f9
            g = Math.round(130 + (115 - 130) * t); // #82 -> #73
            b = Math.round(246 + (22 - 246) * t); // #f6 -> #16
          } else {
            // Orange to pink
            const t = (progress - 0.5) * 2; // 0 to 1
            r = Math.round(249 + (236 - 249) * t); // #f9 -> #ec
            g = Math.round(115 + (72 - 115) * t); // #73 -> #48
            b = Math.round(22 + (153 - 22) * t); // #16 -> #99
          }

          ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.moveTo(currentPoint.x, currentPoint.y);
          ctx.lineTo(nextPoint.x, nextPoint.y);
          ctx.stroke();
        }
      } else {
        // Use solid color while actively drawing
        ctx.strokeStyle = "#3b82f6";
        ctx.beginPath();
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < currentPath.length; i++) {
          const point = currentPath[i];
          if (point) {
            ctx.lineTo(point.x, point.y);
          }
        }

        ctx.stroke();
      }
    },
    [currentPath, isDrawing]
  );

  // Cache the field image
  const fieldImageRef = useRef<HTMLImageElement | null>(null);
  const drawRef = useRef<(() => void) | null>(null);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image (always use the field image)
    const img = fieldImageRef.current;
    if (img) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawPath(ctx);
    }
  }, [drawPath, canvasSize]);

  drawRef.current = draw;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      fieldImageRef.current = img;
      drawRef.current?.();
    };
    img.src = fieldImageSrc;
  }, [fieldImageSrc]);

  useEffect(() => {
    draw();
  }, [draw, currentPath, canvasSize]);

  // Store callback in ref to avoid dependency issues
  const onPathChangeRef = useRef(onPathChange);
  useEffect(() => {
    onPathChangeRef.current = onPathChange;
  }, [onPathChange]);

  // Notify parent of path changes (debounced to avoid excessive updates)
  // Convert points to relative coordinates before sending
  useEffect(() => {
    if (onPathChangeRef.current && canvasSize.width > 0 && canvasSize.height > 0) {
      // Convert canvas coordinates to relative coordinates (0-1)
      const relativePoints = currentPath.map(canvasToRelative);
      const pathData: PathData = {
        points: relativePoints,
      };
      // Use requestAnimationFrame to batch updates
      const timeoutId = setTimeout(() => {
        onPathChangeRef.current?.(pathData);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [currentPath, canvasSize, canvasToRelative]);

  const getCoordinates = (
    e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0];
      if (touch) {
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
    } else if ("clientX" in e) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }

    return null;
  };

  const startDrawing = (
    e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    const newPoint: PathPoint = {
      x: coords.x,
      y: coords.y,
      timestamp: Date.now(),
    };
    setCurrentPath([newPoint]);
  };

  const drawLine = (
    e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    setCurrentPath((prev) => {
      const newPoint: PathPoint = {
        x: coords.x,
        y: coords.y,
        timestamp: Date.now(),
      };
      return [...prev, newPoint];
    });
  };

  // Smooth path using a simple moving average and point reduction
  const smoothPath = useCallback((points: PathPoint[]): PathPoint[] => {
    if (points.length <= 2) return points;

    // First, apply a simple moving average to smooth the coordinates
    const smoothed: PathPoint[] = [];
    const windowSize = 9; // Number of points to average

    for (let i = 0; i < points.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(points.length - 1, i + Math.floor(windowSize / 2));

      let sumX = 0;
      let sumY = 0;
      let count = 0;

      for (let j = start; j <= end; j++) {
        const point = points[j];
        if (point) {
          sumX += point.x;
          sumY += point.y;
          count++;
        }
      }

      const currentPoint = points[i];
      if (currentPoint && count > 0) {
        smoothed.push({
          x: sumX / count,
          y: sumY / count,
          timestamp: currentPoint.timestamp,
        });
      }
    }

    // Then, reduce points using Douglas-Peucker-like simplification
    // For simplicity, we'll use distance-based reduction
    const minDistance = 2; // Minimum distance between points in pixels
    if (smoothed.length === 0) return points;

    const firstPoint = smoothed[0];
    if (!firstPoint) return points;

    const reduced: PathPoint[] = [firstPoint];

    for (let i = 1; i < smoothed.length - 1; i++) {
      const prev = reduced[reduced.length - 1];
      const curr = smoothed[i];
      if (!prev || !curr) continue;

      const distance = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);

      if (distance >= minDistance) {
        reduced.push(curr);
      }
    }

    // Always include the last point
    if (smoothed.length > 1) {
      const lastPoint = smoothed[smoothed.length - 1];
      if (lastPoint) {
        reduced.push(lastPoint);
      }
    }

    return reduced;
  }, []);

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Smooth the path before saving
    const smoothedPath = smoothPath(currentPath);
    setCurrentPath(smoothedPath);

    // Save to history
    setPathHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...smoothedPath]);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const historyEntry = pathHistory[newIndex];
      if (historyEntry) {
        setHistoryIndex(newIndex);
        setCurrentPath([...historyEntry]);
      }
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setCurrentPath([]);
    }
  };

  const redo = () => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const historyEntry = pathHistory[newIndex];
      if (historyEntry) {
        setHistoryIndex(newIndex);
        setCurrentPath([...historyEntry]);
      }
    }
  };

  const clear = () => {
    setCurrentPath([]);
    setPathHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <div className={className}>
      <div className="mb-2 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0 && currentPath.length === 0}
        >
          <Undo2Icon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= pathHistory.length - 1}
        >
          <Redo2Icon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={currentPath.length === 0}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className="relative w-full touch-none flex justify-center"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border rounded-lg bg-gray-50"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          onMouseDown={startDrawing}
          onMouseMove={drawLine}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={drawLine}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}
