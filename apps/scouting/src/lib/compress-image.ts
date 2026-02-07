"use client";

import imageCompression from "browser-image-compression";

const MAX_FILE_SIZE_MB = 5;
const MAX_WIDTH_OR_HEIGHT = 1920;
const INITIAL_QUALITY = 0.85;

/**
 * Compress an image file for upload.
 * - Converts HEIC/HEIF to JPEG
 * - Resizes to max 1920px width/height (maintaining aspect ratio)
 * - Compresses to JPEG at 85% quality
 * - Rejects if compressed size exceeds 5MB
 *
 * @param file - The image file to compress
 * @returns Promise resolving to compressed file or error message
 */
export async function compressImage(
  file: File
): Promise<{ file: File } | { error: string }> {
  try {
    let fileToCompress = file;

    // Convert HEIC/HEIF to JPEG using browser's native capabilities
    // Most modern browsers can decode HEIC via canvas when supported
    if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
      try {
        // Try to convert HEIC to JPEG using canvas
        const heicBlob = await convertHeicToJpeg(file);
        fileToCompress = new File([heicBlob], file.name.replace(/\.heic$/i, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (heicError) {
        // If HEIC conversion fails, try to compress anyway
        // browser-image-compression may handle it
        console.warn("HEIC conversion failed, attempting direct compression:", heicError);
      }
    }

    // Compress the image
    const options = {
      maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
      initialQuality: INITIAL_QUALITY,
      fileType: "image/jpeg" as const,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(fileToCompress, options);

    // Check if compressed file exceeds size limit
    const sizeMB = compressedFile.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return {
        error: `Photo is too large after compression (${sizeMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB. Try a smaller or lower-quality image.`,
      };
    }

    // Ensure the file has a .jpg extension
    const fileName = compressedFile.name.replace(/\.\w+$/, ".jpg");
    const outputFile = new File([compressedFile], fileName, {
      type: "image/jpeg",
    });

    return { file: outputFile };
  } catch (error) {
    console.error("Image compression error:", error);
    return {
      error: "Failed to compress image. Please try a different photo.",
    };
  }
}

/**
 * Convert HEIC/HEIF to JPEG using canvas
 * Note: This relies on the browser's ability to decode HEIC, which may not be available in all browsers
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert canvas to blob"));
            }
          },
          "image/jpeg",
          INITIAL_QUALITY
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load HEIC image"));
    };

    img.src = url;
  });
}
