import { NextRequest, NextResponse } from "next/server";
import {
  AdminAuthError,
  requireAdminFromRequest,
} from "@/app/lib/shop/admin-auth";
import { getDbClient } from "@/app/lib/listener-profile/db";

const VALID_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    const form = await request.formData();
    const file = form.get("file");
    const kindRaw = form.get("kind");
    const kind = kindRaw === "gallery" ? "gallery" : "cover";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!VALID_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, or WebP image." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5MB or smaller." },
        { status: 400 }
      );
    }

    const ext = EXT_BY_TYPE[file.type] ?? "jpg";
    const path = `products/${admin.userId}/${kind}-${Date.now()}.${ext}`;
    const db = getDbClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from("merch-photos")
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[admin/shop/upload]", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Upload failed" },
        { status: 500 }
      );
    }

    const { data } = db.storage.from("merch-photos").getPublicUrl(path);
    if (!data?.publicUrl) {
      return NextResponse.json(
        { error: "Could not get public URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/shop/upload]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
