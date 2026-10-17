"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Play } from "lucide-react";
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
import {
  buildYoutubeEmbedSrc,
  upgradeYoutubeThumbnail,
  youtubeVideoIdFromUrl,
  YOUTUBE_IFRAME_ALLOW,
} from "@/app/lib/utils/youtube";
import { trackEvent } from "@/app/lib/analytics";
import {
  useYoutubePlaybackAnalytics,
  type YoutubePlayerApi,
} from "@/app/lib/hooks/useYoutubePlaybackAnalytics";
import { StreamCrateQueue } from "@/app/components/stream/StreamCrateQueue";
import { AddSetToCrateButton } from "@/app/components/profile/AddSetToCrateButton";
import { VaultLockedTeaser } from "@/app/components/vault/VaultLockedTeaser";
import type { VaultWeek } from "@/app/lib/vault/types";
import { isLikelySpamTracklist } from "@/app/lib/utils/tracklistQuality";
import { cleanTracklistDisplayLabels } from "@/app/lib/utils/tracklistText";

const PLAYER_IFRAME_ID = "braindance-stream-player";

/** Read `?t=` deep-link offset (moments / shared timestamps). */
function readStartSecondsFromLocation(): number | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const t = new URLSearchParams(window.location.search).get("t");
    if (t == null || t === "") return undefined;
    const seconds = Number(t);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.floor(seconds);
  } catch {
    /* ignore */
  }
  return undefined;
}

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
    <div
      className="page-bends-bg fixed inset-0 z-[100] flex h-dvh flex-col items-center justify-center gap-5 px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        className="h-14 w-14 animate-spin rounded-full border-2 border-brand-to/30 border-t-brand-from border-r-brand-via/70"
        aria-hidden
      />
      <p className="text-lg font-medium tracking-wide text-zinc-900 dark:text-zinc-100">
        Loading
        <span
          className="inline-block animate-[loading-dots_1.2s_steps(4,end)_infinite] overflow-hidden whitespace-nowrap align-bottom"
          aria-hidden
        >
          ...
        </span>
      </p>
    </div>
  );
}

function parseTracksPayload(raw: unknown): TrackRow[] {
  let rows: TrackRow[] = [];
  if (Array.isArray(raw)) rows = raw as TrackRow[];
  else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const list = o.tracks ?? o.data;
    if (Array.isArray(list)) rows = list as TrackRow[];
  }
  return cleanTracklistDisplayLabels(rows);
}

type DjNativeTrack = {
  timestamp_label?: string;
  artist?: string;
  title?: string;
  raw?: string;
  position?: number;
};

/** Maps `GET /dj-sets/:id/tracklists` (Supabase / YouTube parser) into sidebar rows. */
function mapDjSetTracklistResponse(data: unknown): TrackRow[] {
  if (!data || typeof data !== "object") return [];
  const items =
    (data as { items?: { payload?: { tracks?: DjNativeTrack[] } }[] }).items ??
    [];
  const first = items.find((i) => i.payload?.tracks?.length);
  const tracks = first?.payload?.tracks ?? [];
  const cleaned = cleanTracklistDisplayLabels(
    tracks.map((t) => ({
      artist: (t.artist ?? "").trim(),
      title: (t.title ?? t.raw ?? "Track").trim(),
      position: t.position,
      timestamp_label: t.timestamp_label,
    }))
  );
  return cleaned.map((t, idx) => ({
    id: `dj-${String(t.position ?? idx + 1)}-${idx}`,
    timestamp: t.timestamp_label?.trim() || "—",
    artist: (t.artist ?? "").trim() || "—",
    title: (t.title ?? "Track").trim(),
    spotify_url: null,
    soundcloud_url: null,
  }));
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
    { title: string; subtitle: string; url: string; kind?: "youtube_set" | "youtube_channel" | "other" }[]
  >([]);
  const [djSet, setDjSet] = useState<DjSetItem | null>(null);
  const [isDbEvent, setIsDbEvent] = useState<boolean>(false);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("");
  const [pipelineStream, setPipelineStream] = useState<PipelineStream | null>(
    null
  );
  const [pipelineTracks, setPipelineTracks] = useState<TrackRow[]>([]);
  const [djSetTracks, setDjSetTracks] = useState<TrackRow[]>([]);
  /** Empty-state or error copy for the DJ-set sidebar (missing tracklist vs fetch failure). */
  const [djSetTracklistError, setDjSetTracklistError] = useState<string | null>(
    null
  );
  const [isPlayerActivated, setIsPlayerActivated] = useState(
    () => readStartSecondsFromLocation() !== undefined
  );
  /** Initial YouTube embed offset (from `?t=` or first tracklist seek before play). */
  const [startSeconds, setStartSeconds] = useState<number | undefined>(
    readStartSecondsFromLocation
  );
  /**
   * Moment / `?t=` deep links autoplay muted so mobile browsers actually start
   * playback (unmuted autoplay is blocked after navigation).
   */
  const [autoplayMuted, setAutoplayMuted] = useState(
    () => readStartSecondsFromLocation() !== undefined
  );
  const playerApiRef = useRef<YoutubePlayerApi | null>(null);
  const [analyticsSource, setAnalyticsSource] = useState<string | undefined>();
  const [crateId, setCrateId] = useState<string | null>(null);
  const [vaultGate, setVaultGate] = useState<{
    checking: boolean;
    gated: boolean;
    unlocked: boolean;
    week: VaultWeek | null;
    points: number;
    reason: string | null;
  }>({
    checking: true,
    gated: false,
    unlocked: true,
    week: null,
    points: 0,
    reason: null,
  });

  useEffect(() => {
    setAnalyticsSource(undefined);
    setCrateId(null);

    const deepLinkStart = readStartSecondsFromLocation();
    if (deepLinkStart !== undefined) {
      setStartSeconds(deepLinkStart);
      setIsPlayerActivated(true);
      setAutoplayMuted(true);
    } else {
      setIsPlayerActivated(false);
      setStartSeconds(undefined);
      setAutoplayMuted(false);
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const src = params.get("src");
      if (src) setAnalyticsSource(src);
      const crate = params.get("crate");
      setCrateId(crate && crate.length > 0 ? crate : null);
    } catch {
      /* ignore */
    }
  }, [eventId]);

  const handleSeek = useCallback(
    (seconds: number) => {
      const s = Math.max(0, Math.floor(seconds));
      if (!Number.isFinite(s)) return;

      if (!isPlayerActivated) {
        setStartSeconds(s);
        setAutoplayMuted(true);
        setIsPlayerActivated(true);
        return;
      }

      if (playerApiRef.current) {
        playerApiRef.current.seekTo(s);
        return;
      }

      // API not ready yet — remount embed at this offset.
      setStartSeconds(s);
    },
    [isPlayerActivated]
  );

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const checkVaultAccess = useCallback(async (videoId: string) => {
    const res = await fetch(
      `/api/vault/access?videoId=${encodeURIComponent(videoId)}`,
      { credentials: "same-origin", cache: "no-store" }
    );
    if (!res.ok) {
      setVaultGate({
        checking: false,
        gated: false,
        unlocked: true,
        week: null,
        points: 0,
        reason: null,
      });
      return { locked: false as const };
    }
    const body = (await res.json()) as {
      gated?: boolean;
      unlocked?: boolean;
      week?: VaultWeek | null;
      points?: number;
      reason?: string | null;
    };
    const gated = Boolean(body.gated);
    const unlocked = body.unlocked !== false;
    setVaultGate({
      checking: false,
      gated,
      unlocked,
      week: body.week ?? null,
      points: body.points ?? 0,
      reason: body.reason ?? null,
    });
    return { locked: gated && !unlocked };
  }, []);

  const fetchEventData = useCallback(async () => {
    if (!eventId) {
      setStreamLoading(false);
      return;
    }

    setStreamLoading(true);
    setPipelineStream(null);
    setPipelineTracks([]);
    setDjSetTracks([]);
    setDjSetTracklistError(null);
    setDjSet(null);
    setMerchItems([]);
    setVaultGate((prev) => ({ ...prev, checking: true }));

    try {
      // Gate YouTube-id routes before any metadata fetch (keeps the set secret).
      if (!isUuid(eventId)) {
        const { locked } = await checkVaultAccess(eventId);
        if (locked) {
          setStreamLoading(false);
          return;
        }
      }

      if (isUuid(eventId)) {
        const streamRes = await fetch(`/api/streams/${encodeURIComponent(eventId)}`);
        if (streamRes.ok) {
          const body = (await streamRes.json()) as PipelineStream & {
            backendSource?: string;
            error?: string;
          };
          if (body.youtube_url) {
            const videoId =
              youtubeVideoIdFromUrl(body.youtube_url) ?? body.youtube_url.trim();
            const { locked } = await checkVaultAccess(videoId);
            if (locked) {
              setStreamLoading(false);
              return;
            }

            const tracksRes = await fetch(
              `/api/streams/${encodeURIComponent(eventId)}/tracks`
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

            const links: {
              title: string;
              subtitle: string;
              url: string;
              kind?: "youtube_set" | "youtube_channel" | "other";
            }[] = [
              {
                title: "Watch on YouTube",
                subtitle: body.artist,
                url: body.youtube_url,
                kind: "youtube_set",
              },
            ];
            if (body.soundcloud_url) {
              links.push({
                title: "SoundCloud",
                subtitle: "Listen on SoundCloud",
                url: body.soundcloud_url,
                kind: "other",
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
          kind: "other" as const,
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
            kind: "youtube_set",
          },
          {
            title: "More From Channel",
            subtitle: payload.item.channel,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
              payload.item.channel
            )}`,
            kind: "youtube_channel",
          },
        ]);

        try {
          const tr = await fetch(
            `/api/dj-sets/${encodeURIComponent(payload.item.video_id)}/tracklists`
          );
          const body = (await tr.json()) as {
            items?: unknown;
            error?: string;
          };
          const mapped = mapDjSetTracklistResponse(body);
          const upstreamErr =
            typeof body.error === "string" && body.error.trim()
              ? body.error.trim()
              : null;
          const spammy = mapped.length > 0 && isLikelySpamTracklist(mapped);

          if (!tr.ok) {
            setDjSetTracks([]);
            setDjSetTracklistError(
              upstreamErr ?? `Tracklist request failed (HTTP ${tr.status}).`
            );
          } else if (spammy) {
            // YouTube-comment scrapes sometimes store meme cues (same title on every stamp).
            setDjSetTracks([]);
            setDjSetTracklistError("No reliable tracklist found.");
          } else if (mapped.length > 0) {
            setDjSetTracks(mapped);
            setDjSetTracklistError(null);
          } else {
            setDjSetTracks([]);
            setDjSetTracklistError(upstreamErr ?? "No tracklist found.");
          }
        } catch {
          setDjSetTracks([]);
          setDjSetTracklistError(
            "Could not load the tracklist. Check your connection or try again."
          );
        }
      }
    } finally {
      setStreamLoading(false);
      setVaultGate((prev) =>
        prev.checking ? { ...prev, checking: false } : prev
      );
    }
  }, [eventId, checkVaultAccess]);

  const getEmbedUrl = () => {
    if (!url) return "";
    if (platform === "twitch") {
      const parent =
        process.env.NEXT_PUBLIC_TWITCH_PARENT ?? "localhost";
      return `https://player.twitch.tv/?channel=${encodeURIComponent(url)}&parent=${encodeURIComponent(parent)}&autoplay=${isPlayerActivated ? "true" : "false"}&muted=${isPlayerActivated ? "false" : "true"}`;
    }
    return buildYoutubeEmbedSrc(url, {
      autoplay: isPlayerActivated,
      // Deep-link / pre-play seeks: mute so autoplay is allowed; click-to-play stays unmuted.
      mute: autoplayMuted || !isPlayerActivated,
      start: startSeconds,
    });
  };

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const vaultLocked = vaultGate.gated && !vaultGate.unlocked;

  const headerTitle = useMemo(() => {
    if (pipelineStream) return pipelineStream.title;
    return event?.title || djSet?.title || "Live DJ Set";
  }, [pipelineStream, event?.title, djSet?.title]);

  const analyticsMeta = useMemo(() => {
    if (pipelineStream) {
      return {
        set_id: pipelineStream.id,
        set_title: pipelineStream.title,
        artist: pipelineStream.artist,
      };
    }
    if (djSet) {
      return {
        set_id: djSet.video_id,
        set_title: djSet.title,
        artist: djSet.channel,
      };
    }
    if (event) {
      return {
        set_id: eventId,
        set_title: event.title,
        artist: event.location,
      };
    }
    return {
      set_id: eventId,
      set_title: headerTitle,
      artist: undefined as string | undefined,
    };
  }, [pipelineStream, djSet, event, eventId, headerTitle]);

  const playerMountKey = `${PLAYER_IFRAME_ID}-${startSeconds ?? "live"}`;

  useYoutubePlaybackAnalytics({
    enabled:
      !vaultLocked &&
      isPlayerActivated &&
      platform === "youtube" &&
      Boolean(stream),
    iframeId: PLAYER_IFRAME_ID,
    meta: analyticsMeta,
    source: analyticsSource,
    playerApiRef,
    playerMountKey,
  });

  if (streamLoading || vaultGate.checking) {
    return <StreamLoadingScreen />;
  }

  const showTracklist = Boolean(pipelineStream) || Boolean(djSet);

  const sidebarTracks = pipelineStream ? pipelineTracks : djSetTracks;
  const tracklistEmptyHint = pipelineStream
    ? undefined
    : djSetTracklistError ?? "No tracklist found.";
  const crateVideoId =
    djSet?.video_id ||
    youtubeVideoIdFromUrl(pipelineStream?.youtube_url ?? "") ||
    youtubeVideoIdFromUrl(url) ||
    (platform === "youtube" && !isUuid(eventId) ? eventId : "") ||
    "";
  const crateSet = crateVideoId
    ? {
        video_id: crateVideoId,
        title: headerTitle,
        channel:
          djSet?.channel ||
          pipelineStream?.artist ||
          event?.location ||
          "Unknown",
        thumbnail:
          djSet?.thumbnail ||
          pipelineStream?.thumbnail ||
          event?.image_url ||
          null,
      }
    : null;
  const streamArtwork =
    upgradeYoutubeThumbnail(
      event?.image_url || djSet?.thumbnail || pipelineStream?.thumbnail || "",
      djSet?.video_id || youtubeVideoIdFromUrl(pipelineStream?.youtube_url ?? "")
    ) ||
    event?.image_url ||
    djSet?.thumbnail ||
    pipelineStream?.thumbnail ||
    "";

  const renderPlayer = () => {
    if (!stream) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900/50 text-zinc-900">
          Stream unavailable.
        </div>
      );
    }

    if (!isPlayerActivated) {
      return (
        <button
          type="button"
          onClick={() => {
            setAutoplayMuted(false);
            setIsPlayerActivated(true);
          }}
          className="group absolute inset-0 h-full w-full overflow-hidden text-left"
          aria-label={`Play ${headerTitle}`}
        >
          {streamArtwork ? (
            <Image
              src={streamArtwork}
              alt={headerTitle}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              quality={90}
              className="object-cover opacity-55"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-to/40 to-brand-from/20" />
          )}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-gradient-to-r from-brand-from via-brand-via to-brand-to p-[2px] shadow-glow-brand-via">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/65 backdrop-blur-md">
                <Play
                  className="ml-0.5 h-6 w-6 fill-current text-zinc-100"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </button>
      );
    }

    return (
      <iframe
        // Remount when start offset is used as a seek fallback (API not ready).
        key={playerMountKey}
        id={PLAYER_IFRAME_ID}
        className="absolute left-0 top-0 h-full w-full border-0 bg-black"
        src={getEmbedUrl()}
        title={headerTitle}
        allow={
          platform === "twitch"
            ? "autoplay; encrypted-media; fullscreen; picture-in-picture"
            : YOUTUBE_IFRAME_ALLOW
        }
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  };

  if (vaultLocked) {
    return (
      <div className="relative text-zinc-900 overscroll-none">
        <div className="relative z-10 mx-auto max-w-3xl px-5 pb-16 pt-4 md:p-8">
          <VaultLockedTeaser
            week={
              vaultGate.week ?? {
                week_start: "",
                video_id: "",
                youtube_url: "",
                title: "",
                channel: "",
                thumbnail: null,
                created_at: "",
                hidden: true,
              }
            }
            points={vaultGate.points}
            reason={vaultGate.reason}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative text-zinc-900 overscroll-none">
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-5 pt-0 md:p-8">
        <main className="mt-0 md:mt-5">
          {showTracklist ? (
            <>
              <div className="relative mb-4 md:mb-6">
                <div className="lg:pr-[calc(340px+1.5rem)]">
                  <div className="glass-bends-card relative overflow-hidden rounded-none">
                    <div className="aspect-video relative">
                      {renderPlayer()}
                    </div>

                    <div className="mt-4 flex items-center gap-3 px-4 py-3">
                      <h2 className="min-w-0 flex-1 truncate text-2xl font-bold leading-tight tracking-tight text-gradient-bends sm:text-3xl">
                        {headerTitle}
                      </h2>
                      {crateSet ? <AddSetToCrateButton set={crateSet} /> : null}
                    </div>
                  </div>
                </div>
                <aside
                  className="mt-4 flex min-h-0 w-full flex-col md:mt-6 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:h-full lg:w-[340px]"
                  aria-label="Tracklist"
                >
                  <StreamTracklistSidebar
                    tracks={sidebarTracks}
                    emptyHint={tracklistEmptyHint}
                    className="flex-1 lg:h-full"
                    analytics={analyticsMeta}
                    videoId={analyticsMeta.set_id}
                    setTitle={headerTitle}
                    onSeek={platform === "youtube" ? handleSeek : undefined}
                  />
                </aside>
              </div>
              {crateId ? (
                <StreamCrateQueue
                  crateId={crateId}
                  currentVideoId={eventId}
                  className="mb-4 md:mb-6"
                />
              ) : null}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="glass-bends-card relative overflow-hidden rounded-none">
                  <div className="aspect-video relative">
                    {renderPlayer()}
                  </div>

                  <div className="mt-4 flex items-center gap-3 px-4 py-3">
                    <h2 className="min-w-0 flex-1 truncate text-2xl font-bold leading-tight tracking-tight text-gradient-bends sm:text-3xl">
                      {headerTitle}
                    </h2>
                    {crateSet ? <AddSetToCrateButton set={crateSet} /> : null}
                  </div>
                </div>
                {crateId ? (
                  <StreamCrateQueue
                    crateId={crateId}
                    currentVideoId={eventId}
                    className="mt-6"
                  />
                ) : null}
              </div>

              <div>
                <div className="glass-bends-card rounded-none p-4">
                  <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Stats
                  </h3>
                  <div className="mb-4 flex items-center justify-between gap-6">
                    <div>
                      <p className="text-xs text-zinc-500">Views</p>
                      <p className="text-2xl font-semibold tabular-nums text-zinc-900">
                        {views}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Top city</p>
                      <p className="text-2xl font-semibold text-zinc-900">{topCity}</p>
                    </div>
                  </div>
                  {isDbEvent && <GlobeHeatmap id={eventId} />}
                </div>
              </div>
            </div>
          )}
        </main>

        {merchItems.length > 0 && (
          <section className="glass-bends-card relative mt-8 overflow-hidden rounded-none p-5">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-from/[0.14] via-brand-via/[0.06] to-brand-to/[0.14]"
              aria-hidden
            />
            <div className="relative z-10">
              <h3 className="mb-4 bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-[11px] font-semibold uppercase tracking-[0.2em] text-transparent">
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
                      className="text-sm text-brand-to underline-offset-2 transition-[background-image,color] duration-bends-fast ease-bends hover:bg-gradient-to-r hover:from-brand-from hover:via-brand-via hover:to-brand-to hover:bg-clip-text hover:text-transparent hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-brand-from/40"
                      onClick={() => {
                        const payload = {
                          set_id: analyticsMeta.set_id,
                          set_title: analyticsMeta.set_title,
                          artist: analyticsMeta.artist,
                        };
                        if (item.kind === "youtube_set") {
                          trackEvent("youtube_set_clicked", payload);
                        } else if (item.kind === "youtube_channel") {
                          trackEvent("youtube_channel_clicked", payload);
                        }
                      }}
                    >
                      {item.title}
                    </a>
                    {item.subtitle ? (
                      <span className="text-xs text-zinc-500 sm:min-w-0 sm:flex-1 sm:truncate">
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
