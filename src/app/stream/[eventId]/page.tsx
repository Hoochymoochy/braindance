"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import GlobeHeatmap from "@/app/components/GlobeHeatmap";
import { getStreams } from "@/app/lib/events/stream";
import { getTopCity } from "@/app/lib/utils/location";
import { totalViews } from "@/app/lib/events/views";
import { getLinks } from "@/app/lib/events/links";
import { getEventById } from "@/app/lib/events/event";
import dynamic from "next/dynamic";

const ColorBends = dynamic(() => import("@/components/ColorBends"), {
  ssr: false,
  loading: () => null,
});

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
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-white bg-black/80 backdrop-blur-sm">
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
  const containerRef = useRef<HTMLDivElement>(null);

  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
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

  // Smooth parallax effect based on mouse position for 4K depth
  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Calculate parallax based on distance from center
      targetX = (e.clientX - centerX) * 0.015;
      targetY = (e.clientY - centerY) * 0.015;
    };

    const animate = () => {
      // Smooth easing for 4K-like motion
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setParallaxOffset({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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

  const BEND_COLORS = ["#00ccff", "#ff00f7", "#3700ff", "#7a7a7a"] as const;

  if (streamLoading) {
    return <StreamLoadingScreen />;
  }

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden text-white">
      {/* BLACK OVERLAY - Fixed depth layer */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-black/40"
        aria-hidden
      />

      {/* ANIMATED BACKGROUND with 4K parallax depth */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        aria-hidden
        style={{
          transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
          transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
        }}
      >
        <div
          style={{
            width: "1080px",
            height: "1080px",
            position: "relative",
            left: "50%",
            top: "50%",
            transform:
              "translate(-50%, -50%) scale(max(100vw / 1080px, 100vh / 1080px))",
            transformOrigin: "center center",
          }}
        >
          <ColorBends
            rotation={65}
            speed={0.25}
            colors={[...BEND_COLORS]}
            transparent={false}
            autoRotate={0.3}
            scale={1.5}
            frequency={1}
            warpStrength={0}
            mouseInfluence={0}
            parallax={0}
            noise={0}
          />
        </div>
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 mx-auto p-6 md:p-10">
        <main className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Stream */}
          <div className="lg:col-span-2">
            <div className="glass-bends-card relative overflow-hidden rounded-lg backdrop-blur-lg bg-white/5 border border-white/10">
              <div className="aspect-video relative">
                {stream ? (
                  <iframe
                    className="w-full h-full absolute top-0 left-0"
                    src={getEmbedUrl()}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white bg-zinc-900/50">
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
            <div className="glass-bends-card rounded-lg p-4 backdrop-blur-lg bg-white/5 border border-white/10">
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
        <div className="glass-bends-card mt-6 rounded-lg p-4 backdrop-blur-lg bg-white/5 border border-white/10">
          <h3 className="mb-3 bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-lg font-bold text-transparent">
            EXTRA LINKS
          </h3>

          {merchItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {merchItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transform cursor-pointer rounded-md border border-white/12 bg-gradient-to-br from-[#3700ff]/25 to-[#ff00f7]/15 p-4 text-center transition-all hover:scale-105 hover:border-[#00ccff]/35 hover:from-[#3700ff]/45 hover:to-[#00ccff]/20 backdrop-blur-sm"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.subtitle}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No links found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}