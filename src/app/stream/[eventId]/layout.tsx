import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  classifyBackendError,
  fetchJsonWithTimeout,
  getPrimaryBackendUrl,
} from "@/app/lib/backend/http";
import { SITE_NAME, SITE_TAGLINE } from "@/app/lib/site";
import { getEventById } from "@/app/lib/events/event";

type DjSetItem = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  published_at?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function fetchDjSet(videoId: string): Promise<DjSetItem | null> {
  try {
    const base = getPrimaryBackendUrl();
    const raw = await fetchJsonWithTimeout(
      `${base}/dj-sets/${encodeURIComponent(videoId)}`,
      8_000,
      "og/stream",
      { revalidateSeconds: 60 }
    );
    if (!raw || typeof raw !== "object") return null;
    const payload = raw as { item?: DjSetItem } | DjSetItem;
    if ("item" in payload && payload.item) return payload.item;
    if ("video_id" in payload) return payload as DjSetItem;
    return null;
  } catch (error) {
    classifyBackendError(error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId: rawId } = await params;
  const eventId = rawId?.trim();
  if (!eventId) {
    return { title: "Stream" };
  }

  if (isUuid(eventId)) {
    try {
      const event = await getEventById(eventId);
      if (event?.title) {
        const title = event.title;
        const description =
          (typeof event.description === "string" && event.description.trim()) ||
          SITE_TAGLINE;
        return {
          title,
          description,
          openGraph: {
            title,
            description,
            type: "website",
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
          },
        };
      }
    } catch {
      // Fall through to DJ-set lookup / defaults.
    }
  }

  const djSet = await fetchDjSet(eventId);
  if (djSet) {
    const title = djSet.title || "DJ Set";
    const description = djSet.channel
      ? `${djSet.channel} on ${SITE_NAME}`
      : SITE_TAGLINE;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.other",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  }

  return {
    title: "Stream",
    description: SITE_TAGLINE,
  };
}

export default function StreamLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
