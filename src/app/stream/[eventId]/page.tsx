"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import GlobeHeatmap from "@/app/components/GlobeHeatmap";
import {
  StreamTracklistSidebar,
  type TrackRow,
} from "@/app/components/stream/StreamTracklistSidebar";
import { getStreams } from "@/app/lib/events/stream";
import { getTopCity } from "@/app/lib/utils/location";
import { totalViews } from "@/app/lib/events/views";
import { getLinks } from "@/app/lib/events/links";
import { getEventById } from "@/app/lib/events/event";
import { youtubeVideoIdFromUrl } from "@/app/lib/utils/youtube";

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

type PipelineStream = {
  id: string;
  title: string;
  artist: string;
  youtube_url: string;
  soundcloud_url: string | null;
  duration: number;
  thumbnail: string;
  created_at?: string;
};

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

function parseTracksPayload(raw: unknown): TrackRow[] {
  if (Array.isArray(raw)) return raw as TrackRow[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const list = o.tracks ?? o.data;
    if (Array.isArray(list)) return list as TrackRow[];
  }
  return [];
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

const BEND_COLORS = ["#00ccff", "#ff00f7", "#3700ff", "#7a7a7a"] as const;

export default function BraindanceUserStream() {
  const params = useParams();
  const eventId = params?.eventId as string;

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
  const [pipelineStream, setPipelineStream] = useState<PipelineStream | null>(
    null
  );
  const [pipelineTracks, setPipelineTracks] = useState<TrackRow[]>([]);

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      targetX = (e.clientX - centerX) * 0.015;
      targetY = (e.clientY - centerY) * 0.015;
    };

    const animate = () => {
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

  const fetchEventData = useCallback(async () => {
    if (!eventId) {
      setStreamLoading(false);
      return;
    }

    setStreamLoading(true);
    setPipelineStream(null);
    setPipelineTracks([]);

    try {
      if (isUuid(eventId)) {
        const streamRes = await fetch(`/api/streams/${encodeURIComponent(eventId)}`, {
          cache: "no-store",
        });
        if (streamRes.ok) {
          const body = (await streamRes.json()) as PipelineStream & {
            backendSource?: string;
            error?: string;
          };
          if (body.youtube_url) {
            const videoId =
              youtubeVideoIdFromUrl(body.youtube_url) ?? body.youtube_url.trim();
            const tracksRes = await fetch(
              `/api/streams/${encodeURIComponent(eventId)}/tracks`,
              { cache: "no-store" }
            );
            let tracks: TrackRow[] = [];
            if (tracksRes.ok) {
              const tJson = await tracksRes.json();
              tracks = parseTracksPayload(tJson);
            }

            setPipelineStream(body);
            setPipelineTracks(tracks);
            setStreams(videoId);
            setUrl(videoId);
            setPlatform("youtube");
            setIsDbEvent(false);
            setEvent(null);
            setDjSet(null);
            setViews(0);
            setTopCity("Global");

            const links: { title: string; subtitle: string; url: string }[] = [
              {
                title: "Watch on YouTube",
                subtitle: body.artist,
                url: body.youtube_url,
              },
            ];
            if (body.soundcloud_url) {
              links.push({
                title: "SoundCloud",
                subtitle: "Listen on SoundCloud",
                url: body.soundcloud_url,
              });
            }
            setMerchItems(links);
            return;
          }
        }
      }

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

  const headerTitle = useMemo(() => {
    if (pipelineStream) return pipelineStream.title;
    return event?.title || djSet?.title || "Live DJ Set";
  }, [pipelineStream, event?.title, djSet?.title]);

  const headerSubtitle = useMemo(() => {
    if (pipelineStream) {
      return `${pipelineStream.artist} · ${formatDuration(pipelineStream.duration)}`;
    }
    return `${event?.location || djSet?.channel || "Global"} — ${new Date(
      event?.date || djSet?.published_at || Date.now()
    ).toLocaleDateString()}`;
  }, [pipelineStream, event, djSet]);

  if (streamLoading) {
    return <StreamLoadingScreen />;
  }

  const showTracklist = Boolean(pipelineStream);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-black/40"
        aria-hidden
      />

      <div
        className="pointer-events-none fixed inset-0 -z-20"
        aria-hidden
        style={{
          transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
          transition: "transform 0.45s var(--ease-bends-soft)",
        }}
      >
        <div className="absolute inset-0">
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

      <div className="relative z-10 mx-auto max-w-6xl p-5 md:p-8">
        <main className="mt-5">
          {showTracklist ? (
            <>
              <div className="relative mb-6">
                <div className="lg:pr-[calc(340px+1.5rem)]">
                  <div className="glass-bends-card relative overflow-hidden rounded-lg">
                    <div className="aspect-video relative">
                      {stream ? (
                        <iframe
                          className="absolute left-0 top-0 h-full w-full"
                          src={getEmbedUrl()}
                          title={headerTitle}
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-900/50 text-white">
                          Stream unavailable.
                        </div>
                      )}
                    </div>

                    {(pipelineStream || event?.image_url || djSet?.thumbnail) && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-2">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-black/40">
                          {event?.image_url || djSet?.thumbnail || pipelineStream?.thumbnail ? (
                            <Image
                              src={
                                event?.image_url ||
                                djSet?.thumbnail ||
                                pipelineStream?.thumbnail ||
                                ""
                              }
                              alt={headerTitle}
                              width={56}
                              height={56}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-[#3700ff]/50 to-[#00ccff]/20" />
                          )}
                        </div>
                        <div className="min-w-0 text-sm">
                          <h2 className="truncate font-semibold leading-tight text-white">
                            {headerTitle}
                          </h2>
                          <p className="text-xs leading-tight text-gray-400">{headerSubtitle}</p>
                          <p className="line-clamp-2 text-xs italic leading-tight text-gray-300">
                            {pipelineStream
                              ? `Ingested set · ${formatDuration(pipelineStream.duration)}`
                              : event?.description ||
                                "Curated DJ set inside Braindance stream player."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <aside
                  className="mt-6 flex min-h-0 w-full flex-col lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:h-full lg:w-[340px]"
                  aria-label="Tracklist"
                >
                  <StreamTracklistSidebar
                    tracks={pipelineTracks}
                    className="min-h-[10rem] max-h-[min(65vh,520px)] flex-1 lg:h-full lg:max-h-none lg:min-h-0"
                  />
                </aside>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="glass-bends-card relative overflow-hidden rounded-lg">
                  <div className="aspect-video relative">
                    {stream ? (
                      <iframe
                        className="absolute left-0 top-0 h-full w-full"
                        src={getEmbedUrl()}
                        title={headerTitle}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-900/50 text-white">
                        Stream unavailable.
                      </div>
                    )}
                  </div>

                  {(pipelineStream || event?.image_url || djSet?.thumbnail) && (
                    <div className="mt-4 flex items-center gap-3 px-4 py-2">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-black/40">
                        {event?.image_url || djSet?.thumbnail || pipelineStream?.thumbnail ? (
                          <Image
                            src={
                              event?.image_url ||
                              djSet?.thumbnail ||
                              pipelineStream?.thumbnail ||
                              ""
                            }
                            alt={headerTitle}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-[#3700ff]/50 to-[#00ccff]/20" />
                        )}
                      </div>
                      <div className="min-w-0 text-sm">
                        <h2 className="truncate font-semibold leading-tight text-white">
                          {headerTitle}
                        </h2>
                        <p className="text-xs leading-tight text-gray-400">{headerSubtitle}</p>
                        <p className="line-clamp-2 text-xs italic leading-tight text-gray-300">
                          {pipelineStream
                            ? `Ingested set · ${formatDuration(pipelineStream.duration)}`
                            : event?.description ||
                              "Curated DJ set inside Braindance stream player."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="glass-bends-card rounded-lg p-4">
                  <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
                    Stats
                  </h3>
                  <div className="mb-4 flex items-center justify-between gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Views</p>
                      <p className="text-2xl font-semibold tabular-nums text-white/90">
                        {views}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Top city</p>
                      <p className="text-2xl font-semibold text-white/90">{topCity}</p>
                    </div>
                  </div>
                  {isDbEvent && <GlobeHeatmap id={eventId} />}
                </div>
              </div>
            </div>
          )}
        </main>

        {merchItems.length > 0 && (
          <section className="glass-bends-card relative mt-8 overflow-hidden rounded-xl p-5">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00ccff]/[0.14] via-[#ff00f7]/[0.06] to-[#3700ff]/[0.14]"
              aria-hidden
            />
            <div className="relative z-10">
              <h3 className="mb-4 bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-[11px] font-semibold uppercase tracking-[0.2em] text-transparent">
                Links
              </h3>
              <ul className="space-y-3">
                {merchItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/90 underline-offset-2 transition-[background-image,color] duration-bends-fast ease-bends hover:bg-gradient-to-r hover:from-[#00ccff] hover:via-[#ff00f7] hover:to-[#3700ff] hover:bg-clip-text hover:text-transparent hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#00ccff]/40"
                    >
                      {item.title}
                    </a>
                    {item.subtitle ? (
                      <span className="text-xs text-gray-500 sm:min-w-0 sm:flex-1 sm:truncate">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
