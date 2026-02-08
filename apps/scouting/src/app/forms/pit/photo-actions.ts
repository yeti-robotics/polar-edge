"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
  robotPhotoKey,
} from "@/lib/server/storage";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Generate a presigned PUT URL for uploading a robot photo.
 * Requires authenticated member with an active organization.
 */
export async function getPhotoUploadUrl(params: {
  teamNumber: number;
  index: number;
  contentType: string;
  fileSize: number;
}): Promise<{ url: string; key: string } | { error: string }> {
  try {
    // Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Get active member
    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });
    if (!activeMember?.organizationId) {
      return { error: "No active organization" };
    }

    // Validate content type
    if (
      !ALLOWED_CONTENT_TYPES.includes(params.contentType as (typeof ALLOWED_CONTENT_TYPES)[number])
    ) {
      return { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." };
    }

    // Validate file size
    if (!Number.isInteger(params.fileSize) || params.fileSize <= 0) {
      return { error: "Invalid file size" };
    }
    if (params.fileSize > MAX_FILE_SIZE_BYTES) {
      return { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB` };
    }

    // Validate team number
    if (!Number.isInteger(params.teamNumber) || params.teamNumber <= 0) {
      return { error: "Invalid team number" };
    }

    // Validate index
    if (!Number.isInteger(params.index) || params.index < 0 || params.index > 9) {
      return { error: "Invalid photo index (0-9)" };
    }

    // Generate object key
    const extension = params.contentType.split("/")[1] ?? "jpg";
    const key = robotPhotoKey({
      organizationId: activeMember.organizationId,
      teamNumber: params.teamNumber,
      index: params.index,
      extension,
    });

    const result = await createPresignedUploadUrl(key, params.contentType, params.fileSize);
    return result;
  } catch (error) {
    console.error("Get photo upload URL error:", error);
    return { error: "Failed to generate upload URL" };
  }
}

/**
 * Generate a presigned GET URL for viewing a robot photo.
 * Requires authenticated member.
 */
export async function getPhotoViewUrl(
  objectKey: string
): Promise<{ url: string } | { error: string }> {
  try {
    // Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Get active member for org scoping
    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });
    if (!activeMember?.organizationId) {
      return { error: "No active organization" };
    }

    // Security: verify the object key belongs to the user's organization
    if (!objectKey.startsWith(`${activeMember.organizationId}/`)) {
      return { error: "Access denied" };
    }

    const url = await createPresignedDownloadUrl(objectKey);
    return { url };
  } catch (error) {
    console.error("Get photo view URL error:", error);
    return { error: "Failed to generate view URL" };
  }
}
