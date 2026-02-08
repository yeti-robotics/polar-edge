"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import { Camera, X } from "lucide-react";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";

const MAX_PHOTOS = 5;
const LARGE_FILE_WARNING_MB = 5;

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
}

export interface PitPhotoUploadRef {
  getPendingFiles: () => File[];
}

interface PitPhotoUploadProps {
  disabled?: boolean;
  children?: React.ReactNode;
}

export const PitPhotoUpload = forwardRef<PitPhotoUploadRef, PitPhotoUploadProps>(
  ({ disabled = false, children }, ref) => {
    const [photos, setPhotos] = useState<PhotoFile[]>([]);

    // Expose getPendingFiles method to parent
    useImperativeHandle(ref, () => ({
      getPendingFiles: () => photos.map((p) => p.file),
    }));

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      setPhotos((prev) => {
        const remaining = MAX_PHOTOS - prev.length;
        const toAdd = files.slice(0, remaining);

        const newPhotos: PhotoFile[] = toAdd.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          id: `${Date.now()}-${Math.random()}`,
        }));

        return [...prev, ...newPhotos];
      });

      // Reset input so same file can be selected again
      e.target.value = "";
    }, []);

    const handleRemove = useCallback((id: string) => {
      setPhotos((prev) => {
        const photo = prev.find((p) => p.id === id);
        if (photo) {
          URL.revokeObjectURL(photo.preview);
        }
        return prev.filter((p) => p.id !== id);
      });
    }, []);

    const canAddMore = photos.length < MAX_PHOTOS;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Robot Photos</CardTitle>
          <CardDescription>Add up to {MAX_PHOTOS} photos of the robot (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onRemove={handleRemove}
                  disabled={disabled}
                />
              ))}
            </div>
          ) : null}

          {/* Add photo button */}
          {canAddMore ? (
            <div>
              <input
                type="file"
                id="photo-input"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleFileSelect}
                disabled={disabled}
                className="sr-only"
                aria-label="Select photos"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[44px]"
                onClick={() => document.getElementById("photo-input")?.click()}
                disabled={disabled}
              >
                <Camera className="mr-2 h-5 w-5" />
                {photos.length === 0 ? "Add Photos" : `Add More (${photos.length}/${MAX_PHOTOS})`}
              </Button>
            </div>
          ) : null}

          {/* Composition slot for status components */}
          {children}
        </CardContent>
      </Card>
    );
  }
);

PitPhotoUpload.displayName = "PitPhotoUpload";

// Explicit status component variants (follows patterns-explicit-variants)

export function PhotoCompressionProgress({ value }: { value?: number }) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">Compressing images…</div>
      {value !== undefined ? <Progress value={value} /> : null}
    </div>
  );
}

export function PhotoUploadProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Uploading {current} of {total}…
      </div>
      <Progress value={(current / total) * 100} />
    </div>
  );
}

export function PhotoUploadError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

// Memoized thumbnail component to avoid re-rendering all thumbnails when one changes
interface PhotoThumbnailProps {
  photo: PhotoFile;
  onRemove: (id: string) => void;
  disabled: boolean;
}

const PhotoThumbnail = ({ photo, onRemove, disabled }: PhotoThumbnailProps) => {
  const sizeMB = useMemo(() => photo.file.size / (1024 * 1024), [photo.file.size]);
  const showWarning = sizeMB > LARGE_FILE_WARNING_MB;

  const handleRemove = useCallback(() => {
    onRemove(photo.id);
  }, [onRemove, photo.id]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
      <img src={photo.preview} alt={photo.file.name} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={handleRemove}
        disabled={disabled}
        className="absolute right-1 top-1 rounded-full bg-background/80 p-1.5 shadow-sm transition-colors hover:bg-background disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={`Remove ${photo.file.name}`}
      >
        <X className="h-4 w-4" />
      </button>
      {showWarning ? (
        <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/90 px-2 py-1 text-xs text-yellow-950">
          Large file – will be compressed
        </div>
      ) : null}
    </div>
  );
};
