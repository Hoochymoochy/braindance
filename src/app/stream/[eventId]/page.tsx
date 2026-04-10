"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import GlobeHeatmap from "@/app/components/GlobeHeatmap";
import { getStreams } from "@/app/lib/events/stream";
import { getTopCity } from "@/app/lib/utils/location";
import { totalViews } from "@/app/lib/events/views";
import { getLinks } from "@/app/lib/events/links";
import { getEventById } from "@/app/lib/events/event";

interface Event {
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
}

interface DjSetItem {
  video_id: string;
  title: string;
  channel: string;
  published_at: string;
  thumbnail?: string;
  url: string;
  view_count?: number;
  duration_seconds?: number;
}

function StreamLoadingScreen() {
  return (
    <div className="page-bends-bg fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-white">
      <div
        className="h-14 w-14 animate-spin rounded-full border-2 border-[#3700ff]/30 border-t-[#00ccff] border-r-[#ff00f7]/70"
        aria-hidden
      />
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#00ccff]/90">
          Braindance
        </p>
        <p className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-lg font-semibold text-transparent">
          Loading stream…
        </p>
        <p className="mx-auto max-w-xs text-sm text-[#7a7a7a]">
          Hang tight while we prepare your player.
        </p>
      </div>
    </div>
  );
}

export default function BraindanceUserStream() {
  const params = useParams();
  const eventId = params?.eventId as string;

  const [streamLoading, setStreamLoading] = useState(true);
  const [stream, setStreams] = useState<string>("");
  const [views, setViews] = useState(0);
  const [topCity, setTopCity] = useState("");
  const [event, setEvent] = useState<Event | null>(null);
  const [merchItems, setMerchItems] = useState<
    { title: string; subtitle: string; url: string }[]
  >([]);
  const [djSet, setDjSet] = useState<DjSetItem | null>(null);
  const [isDbEvent, setIsDbEvent] = useState<boolean>(false);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("");

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const fetchEventData = useCallback(async () => {
    if (!eventId) {
      setStreamLoading(false);
      return;
    }

    setStreamLoading(true);
    try {
      const [streamData, links, eventData] = await Promise.all([
        getStreams(eventId),
        getLinks(eventId),
        getEventById(eventId),
      ]);

      let city: string | null = "Unknown";
      let viewCount = 0;
      if (isUuid(eventId)) {
        [city, viewCount] = await Promise.all([
          getTopCity(eventId),
          totalViews(eventId),
        ]);
      }

      setEvent(eventData);
      if (streamData?.length > 0) {
        setStreams(streamData[0].link);
        setUrl(streamData[0].link);
        setPlatform(streamData[0].platform || "youtube");
      }
      setTopCity(city || "Unknown");
      setViews(viewCount || 0);

      setMerchItems(
        links.map((link) => ({
          title: link.label,
          subtitle: link.description || "Exclusive drop – limited time only!",
          url: link.link,
        }))
      );

      if (!eventData && (!streamData || streamData.length === 0)) {
        throw new Error("Not a DB-backed event stream");
      }
      setIsDbEvent(Boolean(eventData) && isUuid(eventId));
    } catch {
      // Fallback: eventId can be a DJ set video id routed internally.
      const response = await fetch("/api/dj-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: eventId }),
      });
      const payload = (await response.json()) as { item: DjSetItem | null };
      if (payload.item) {
        setIsDbEvent(false);
        setDjSet(payload.item);
        setStreams(payload.item.video_id);
        setUrl(payload.item.video_id);
        setPlatform("youtube");
        setViews(payload.item.view_count ?? 0);
        setTopCity("Global");
        setMerchItems([
          {
            title: "Watch on YouTube",
            subtitle: "Open the source video on YouTube",
            url: payload.item.url,
          },
          {
            title: "More From Channel",
            subtitle: payload.item.channel,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
              payload.item.channel
            )}`,
          },
        ]);
      }
    } finally {
      setStreamLoading(false);
    }
  }, [eventId]);

  const getEmbedUrl = () => {
    if (!url) return "";
    if (platform === "twitch") {
      return `https://player.twitch.tv/?channel=${url}&parent=braindance.live`;
    }
    return `https://www.youtube.com/embed/${url}?autoplay=1&mute=1`;
  };

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  if (streamLoading) {
    return <StreamLoadingScreen />;
  }

  return (
    <div className="mx-auto p-6 text-white md:p-10">
      <main className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stream */}
        <div className="lg:col-span-2">
          <div className="glass-bends-card relative overflow-hidden rounded-lg">
            <div className="aspect-video relative">
              {stream ? (
                <iframe
                  className="w-full h-full absolute top-0 left-0"
                  src={getEmbedUrl()}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white bg-zinc-900">
                  Stream loading...
                </div>
              )}
            </div>

            {(event?.image_url || djSet?.thumbnail) && (
              <div className="mt-4 flex items-center gap-3 px-4 py-2">
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={event?.image_url || djSet?.thumbnail || ""}
                    alt={event?.title || djSet?.title || "DJ Set"}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="text-sm">
                  <h2 className="text-white font-semibold leading-tight">
                    {event?.title || djSet?.title || "Live DJ Set"}
                  </h2>
                  <p className="text-xs text-gray-400 leading-tight">
                    {event?.location || djSet?.channel || "Global"} —{" "}
                    {new Date(event?.date || djSet?.published_at || Date.now()).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-300 italic leading-tight">
                    {event?.description || "Curated DJ set inside Braindance stream player."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div>
          <div className="glass-bends-card rounded-lg p-4">
            <h3 className="mb-3 bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-lg font-bold text-transparent">
              TOP STATS
            </h3>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Views</p>
                <p className="text-3xl font-bold text-[#00ccff]">{views}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Top City</p>
                <p className="text-3xl font-bold text-[#ff00f7]">{topCity}</p>
              </div>
            </div>
            {isDbEvent && <GlobeHeatmap id={eventId} />}
          </div>
        </div>
      </main>

      {/* Tags + Merch */}
      <div className="glass-bends-card mt-6 rounded-lg p-4">
        <h3 className="mb-3 bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-lg font-bold text-transparent">
          MERCH & TICKETS
        </h3>

        {merchItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {merchItems.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block transform cursor-pointer rounded-md border border-white/12 bg-gradient-to-br from-[#3700ff]/25 to-[#ff00f7]/15 p-4 text-center transition-all hover:scale-105 hover:border-[#00ccff]/35 hover:from-[#3700ff]/45 hover:to-[#00ccff]/20"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-gray-400 mt-1">{item.subtitle}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">
            No merch or tickets available.
          </p>
        )}
      </div>
    </div>
  );
}
