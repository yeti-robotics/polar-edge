"use client";

import { toast } from "@repo/ui/components/sonner";
import { useCallback, useState } from "react";

export interface PhotoUploadState {
  status: "idle" | "compressing" | "uploading";
  uploadProgress?: { current: number; total: number };
  compressionProgress?: number;
  error?: string;
}

export interface UsePhotoUploadReturn {
  state: PhotoUploadState;
  uploadPhotos: (files: File[], teamNumber: number) => Promise<string[] | null>;
  reset: () => void;
}

/**
 * Custom hook to handle photo compression and upload orchestration.
 * Follows state-decouple-implementation pattern by encapsulating all photo upload logic.
 */
export function usePhotoUpload(): UsePhotoUploadReturn {
  const [state, setState] = useState<PhotoUploadState>({ status: "idle" });

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const uploadPhotos = useCallback(
    async (files: File[], teamNumber: number): Promise<string[] | null> => {
      if (files.length === 0) {
        return null;
      }

      try {
        setState({ status: "compressing" });

        // Dynamically import compression utility
        const { compressImage } = await import("@/lib/compress-image");

        // Compress all photos in parallel
        const compressionResults = await Promise.all(files.map((file) => compressImage(file)));

        // Check for compression errors
        const firstError = compressionResults.find((r) => "error" in r);
        if (firstError && "error" in firstError) {
          setState({ status: "idle", error: firstError.error });
          toast.error(firstError.error);
          return null;
        }

        // Extract compressed files
        const compressedFiles = compressionResults
          .filter((r): r is { file: File } => "file" in r)
          .map((r) => r.file);

        setState({
          status: "uploading",
          uploadProgress: { current: 0, total: compressedFiles.length },
        });

        // Get all presigned URLs in parallel
        const { getPhotoUploadUrl } = await import("../photo-actions");
        const urlPromises = compressedFiles.map((file, index) =>
          getPhotoUploadUrl({
            teamNumber,
            index,
            contentType: "image/jpeg",
            fileSize: file.size,
          })
        );

        const urlResults = await Promise.all(urlPromises);

        // Check for URL generation errors
        const firstUrlError = urlResults.find((r) => "error" in r);
        if (firstUrlError && "error" in firstUrlError) {
          setState({ status: "idle", error: firstUrlError.error });
          toast.error(firstUrlError.error);
          return null;
        }

        // Extract URLs and keys
        const urlsAndKeys = urlResults.filter(
          (r): r is { url: string; key: string } => "url" in r && "key" in r
        );

        // Upload all photos in parallel
        const uploadPromises = compressedFiles.map(async (file, index) => {
          const urlData = urlsAndKeys[index];
          if (!urlData) {
            throw new Error(`Missing URL for photo ${index + 1}`);
          }
          const { url, key } = urlData;

          try {
            const response = await fetch(url, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": "image/jpeg",
              },
            });

            if (!response.ok) {
              const errorText = await response.text().catch(() => "No error details");
              console.error(`Upload failed for photo ${index + 1}:`, {
                status: response.status,
                statusText: response.statusText,
                errorText,
                url: url.split("?")[0], // Log URL without query params
              });
              throw new Error(
                `Upload failed for photo ${index + 1}: ${response.status} ${response.statusText}`
              );
            }

            setState((prev) => ({
              ...prev,
              uploadProgress: { current: index + 1, total: compressedFiles.length },
            }));

            return key;
          } catch (error) {
            console.error(`Network error uploading photo ${index + 1}:`, error);
            throw error;
          }
        });

        const photoKeys = await Promise.all(uploadPromises);

        setState({ status: "idle" });
        return photoKeys;
      } catch (error) {
        console.error("Photo upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to upload photos";
        setState({ status: "idle", error: errorMessage });
        toast.error(errorMessage);
        return null;
      }
    },
    []
  );

  return { state, uploadPhotos, reset };
}
