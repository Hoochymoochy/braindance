import { adminFetch } from "@/app/lib/shop/admin-client";

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function validateMerchImage(file: File) {
  if (!VALID_TYPES.includes(file.type)) {
    throw new Error("Use a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
}

export async function uploadMerchImage(
  file: File,
  kind: "cover" | "gallery"
): Promise<string> {
  validateMerchImage(file);
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);

  const res = await adminFetch("/api/admin/shop/upload", {
    method: "POST",
    body,
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Upload failed");
  }
  return data.url;
}
