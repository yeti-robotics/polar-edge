"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import fieldImage from "./2026-field-transparent.png";
import type { PathData } from "./PathCanvas";

interface PathViewerProps {
  pathData: PathData;
  className?: string;
}

export function PathViewer({ pathData, className }: PathViewerProps) {
  // Always use the official field image
  const fieldImageSrc = typeof fieldImage === "string" ? fieldImage : fieldImage.src;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const drawPath = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (pathData.points.length === 0) return;

      const firstPoint = pathData.points[0];
      if (!firstPoint) return;

      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw path segment by segment with gradient based on temporal order
      if (pathData.points.length > 1) {
        for (let i = 0; i < pathData.points.length - 1; i++) {
          const currentPoint = pathData.points[i];
          const nextPoint = pathData.points[i + 1];
          if (!currentPoint || !nextPoint) continue;

          // Convert relative coordinates (0-1) to canvas coordinates
          // Points are stored relative to image dimensions, so multiply by canvas size
          const currentX = currentPoint.x * canvasSize.width;
          const currentY = currentPoint.y * canvasSize.height;
          const nextX = nextPoint.x * canvasSize.width;
          const nextY = nextPoint.y * canvasSize.height;

          // Calculate color based on temporal position (index) in the path
          const progress = i / (pathData.points.length - 1);

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
          ctx.moveTo(currentX, currentY);
          ctx.lineTo(nextX, nextY);
          ctx.stroke();
        }
      }
    },
    [pathData, canvasSize]
  );

  // Cache the field image
  const fieldImageRef = useRef<HTMLImageElement | null>(null);
  const drawRef = useRef<(() => void) | null>(null);

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
  }, [draw, canvasSize]);

  return (
    <div className={className}>
      <div ref={containerRef} className="relative w-full flex justify-center">
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
        />
      </div>
    </div>
  );
}
