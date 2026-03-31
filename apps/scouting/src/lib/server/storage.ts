import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type PresignerClient = Parameters<typeof getSignedUrl>[0];

function getStorageConfig() {
  const endpoint = process.env.SPACES_ENDPOINT;
  const bucket = process.env.SPACES_BUCKET;
  const key = process.env.SPACES_KEY;
  const secret = process.env.SPACES_SECRET;

  if (!endpoint || !bucket || !key || !secret) {
    throw new Error(
      "Missing storage configuration. Set SPACES_ENDPOINT, SPACES_BUCKET, SPACES_KEY, and SPACES_SECRET."
    );
  }

  return { endpoint, bucket, key, secret };
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  const config = getStorageConfig();
  _client = new S3Client({
    endpoint: config.endpoint,
    region: "us-east-1", // DO Spaces ignores region but SDK requires it
    credentials: {
      accessKeyId: config.key,
      secretAccessKey: config.secret,
    },
    forcePathStyle: false, // DO Spaces uses virtual-hosted-style URLs
  });

  return _client;
}

const UPLOAD_EXPIRATION_SECONDS = 600; // 10 minutes for upload
const DOWNLOAD_EXPIRATION_SECONDS = 3600; // 1 hour for viewing

/**
 * Generate an S3 object key for a robot photo.
 * Pattern: {organizationId}/pit-photos/{teamNumber}/{timestamp}-{index}.{ext}
 */
export function robotPhotoKey(params: {
  organizationId: string;
  teamNumber: number;
  index: number;
  extension?: string;
}): string {
  const ext = params.extension ?? "jpg";
  const timestamp = Date.now();
  return `${params.organizationId}/pit-photos/${params.teamNumber}/${timestamp}-${params.index}.${ext}`;
}

export async function createPresignedUploadUrl(
  objectKey: string,
  contentType: string,
  maxSizeBytes?: number
): Promise<{ url: string; key: string }> {
  const config = getStorageConfig();
  const client = getClient();

  // Sign Bucket, Key, and ContentType. Client must send the same Content-Type
  // (no ContentLength in signature so body size can vary).
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: maxSizeBytes, // Enforce maximum upload size at S3 level
  });

  const url = await getSignedUrl(client as PresignerClient, command, {
    expiresIn: UPLOAD_EXPIRATION_SECONDS,
  });

  return { url, key: objectKey };
}

export async function createPresignedDownloadUrl(objectKey: string): Promise<string> {
  const config = getStorageConfig();
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
  });

  return getSignedUrl(client as PresignerClient, command, {
    expiresIn: DOWNLOAD_EXPIRATION_SECONDS,
  });
}

/**
 * Stream an object from S3 (server-side only). Used by the pit-photo proxy route
 * so Next.js Image optimization can resize, re-encode (WebP/AVIF), and cache.
 */
export async function getObjectStream(
  objectKey: string
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const config = getStorageConfig();
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
  });

  try {
    const response = await client.send(command);
    if (!response.Body) return null;

    const contentType = response.ContentType ?? "application/octet-stream";
    return {
      body: response.Body as ReadableStream,
      contentType,
    };
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
      return null;
    }
    console.error("getObjectStream error:", error);
    return null;
  }
}
