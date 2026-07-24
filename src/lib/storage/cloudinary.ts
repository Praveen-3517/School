// =============================================================================
// EduManage — Cloudinary Storage Utility
// Handles file uploads for student photos and documents
// =============================================================================

import { v2 as cloudinary } from "cloudinary";

// Configure once (server-side only)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  sizeBytes: number;
}

/**
 * Upload a student profile photo to Cloudinary.
 * Returns URL and public ID for storage in database.
 */
export async function uploadStudentPhoto(
  file: Buffer,
  studentId: string,
  mimeType: string
): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `edumanage/students/${studentId}/photos`,
        public_id: `profile_${Date.now()}`,
        overwrite: true,
        resource_type: "image",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message ?? "Upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          sizeBytes: result.bytes,
        });
      }
    );

    uploadStream.end(file);
  });
}

/**
 * Upload a student document to Cloudinary.
 */
export async function uploadStudentDocument(
  file: Buffer,
  studentId: string,
  documentName: string,
  mimeType: string
): Promise<UploadResult> {
  if (!ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed."
    );
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `edumanage/students/${studentId}/documents`,
        public_id: `doc_${Date.now()}`,
        resource_type: isImage ? "image" : "raw",
        allowed_formats: isImage
          ? ["jpg", "jpeg", "png", "webp"]
          : ["pdf"],
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message ?? "Document upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          sizeBytes: result.bytes,
        });
      }
    );

    uploadStream.end(file);
  });
}

/**
 * Delete a file from Cloudinary by its public ID.
 * Used when deleting documents or replacing profile photos.
 */
export async function deleteFile(
  publicId: string,
  resourceType: "image" | "raw" = "image"
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("[Cloudinary] Failed to delete file:", publicId, error);
    // Don't throw — deletion failure shouldn't break the main operation
  }
}

/**
 * Generate a signed URL for private documents (expires in 1 hour by default).
 */
export function getSignedUrl(
  publicId: string,
  expiresInSeconds: number = 3600
): string {
  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    secure: true,
  });
}
