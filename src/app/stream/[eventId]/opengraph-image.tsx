import { ImageResponse } from "next/og";

import {
  fetchJsonWithTimeout,
  getPrimaryBackendUrl,
} from "@/app/lib/backend/http";
import { getEventById } from "@/app/lib/events/event";

export const alt = "Braindance stream";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type DjSetItem = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function resolvePreview(eventId: string): Promise<{
  title: string;
  subtitle: string;
  imageUrl: string | null;
}> {
  if (isUuid(eventId)) {
    try {
      const event = await getEventById(eventId);
      if (event?.title) {
        return {
          title: String(event.title),
          subtitle:
            (typeof event.location === "string" && event.location) ||
            "Live on Braindance",
          imageUrl:
            typeof event.image_url === "string" && event.image_url
              ? event.image_url
              : null,
        };
      }
    } catch {
      // Fall through.
    }
  }

  try {
    const base = getPrimaryBackendUrl();
    const raw = await fetchJsonWithTimeout(
      `${base}/dj-sets/${encodeURIComponent(eventId)}`,
      8_000,
      "og/stream-image",
      { revalidateSeconds: 60 }
    );
    if (raw && typeof raw === "object") {
      const payload = raw as { item?: DjSetItem } | DjSetItem;
      const item =
        "item" in payload && payload.item
          ? payload.item
          : "video_id" in payload
            ? (payload as DjSetItem)
            : null;
      if (item) {
        return {
          title: item.title || "DJ Set",
          subtitle: item.channel ? `${item.channel} · Braindance` : "Braindance",
          imageUrl:
            item.thumbnail ||
            (item.video_id
              ? `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`
              : null),
        };
      }
    }
  } catch {
    // Fall through to defaults.
  }

  return {
    title: "DJ Set",
    subtitle: "Stream on Braindance",
    imageUrl: null,
  };
}

function BrandChip() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        borderRadius: 999,
        background: "rgba(10,10,12,0.72)",
        border: "1px solid rgba(255,255,255,0.16)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background:
            "linear-gradient(135deg, #00ccff 0%, #ff00f7 50%, #3700ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "#0a0a0c",
        }}
      >
        B
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "#fafafa",
        }}
      >
        braindance
      </div>
    </div>
  );
}

export default async function StreamOpenGraphImage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId: rawId } = await params;
  const eventId = rawId?.trim() || "";
  const preview = await resolvePreview(eventId);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0a0a0c",
          color: "#fafafa",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {preview.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.imageUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              background:
                "linear-gradient(145deg, #0a0a0c 0%, #12121a 45%, #0d0a18 100%)",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "linear-gradient(180deg, rgba(10,10,12,0.35) 0%, rgba(10,10,12,0.15) 42%, rgba(10,10,12,0.88) 100%)",
          }}
        />

        {/* Soft brand watermark across the art */}
        <div
          style={{
            position: "absolute",
            right: -20,
            top: 120,
            display: "flex",
            fontSize: 140,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            color: "rgba(255,255,255,0.12)",
            transform: "rotate(-10deg)",
            lineHeight: 1,
          }}
        >
          braindance
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 56px",
          }}
        >
          <div style={{ display: "flex" }}>
            <BrandChip />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: 980,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
              }}
            >
              {preview.title.length > 90
                ? `${preview.title.slice(0, 87)}…`
                : preview.title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "rgba(250,250,250,0.78)",
              }}
            >
              {preview.subtitle}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
