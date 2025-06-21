"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Play,
  Users,
  Globe,
  Share,
  Heart,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import GlobeHeatmap from "@/app/components/GlobeHeatmap";
import { getStreams } from "@/app/lib/events/stream";
import { getTopCity } from "@/app/lib/utils/location";
import { totalViews } from "@/app/lib/events/views";
import { getAcceptedPhotos } from "@/app/lib/photos/photo";
import { getLinks } from "@/app/lib/events/links";

export default function BraindanceUserStream() {
  const params = useParams();
  const eventId = params?.eventId as string;

  const [streams, setStreams] = useState<string>("");
  const [views, setViews] = useState(0);
  const [topCity, setTopCity] = useState("");
  const [photoData, setPhotoData] = useState<{ src: string; alt: string }[]>(
    []
  );
  const [tags, setTags] = useState<string[]>([]);
  const [merchItems, setMerchItems] = useState<
    { title: string; subtitle: string; url: string }[]
  >([]);

  const fetchEventData = useCallback(async () => {
    if (!eventId) return;

    const [stream, city, viewCount, photos, links] = await Promise.all([
      getStreams(eventId),
      getTopCity(eventId),
      totalViews(eventId),
      getAcceptedPhotos(eventId),
      getLinks(eventId),
    ]);

    setStreams(stream?.[0]?.link || "");
    setTopCity(city || "Unknown");
    setViews(viewCount || 0);

    setPhotoData(
      photos.map((photo) => ({
        src: photo.image_url,
        alt: `Uploaded photo ${photo.id}`,
      }))
    );

    setMerchItems(
      links.map((link) => ({
        title: link.label,
        subtitle: link.description || "Exclusive drop – limited time only!",
        url: link.link,
      }))
    );
  }, [eventId]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  return (
    <div className="mx-auto p-10 bg-black thermal-background">
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5">
        {/* Stream */}
        <div className="lg:col-span-2">
          <div className="relative rounded-lg overflow-hidden border border-purple-900/50 bg-black shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <div className="aspect-video relative">
              {streams ? (
                <iframe
                  className="w-full h-full absolute top-0 left-0"
                  src={`https://www.youtube.com/embed/${streams}?autoplay=1&mute=1`}
                  title="YouTube Live Stream"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white bg-zinc-900">
                  Stream loading...
                </div>
              )}
            </div>

            <div className="p-4">
              <h2 className="text-xl font-bold">
                DJ MATRODA - Live from Club Space
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-xs font-bold">DJ</span>
                </div>
                <div>
                  <p className="text-sm font-medium">MATRODA</p>
                  <p className="text-xs text-gray-400">Electronic / House</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <div className="rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              TOP STATS
            </h3>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-400">Total Views</p>
                <p className="text-3xl font-bold text-purple-400">{views}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Top City</p>
                <p className="text-3xl font-bold text-pink-400">{topCity}</p>
              </div>
            </div>
            <GlobeHeatmap id={eventId} />
          </div>
        </div>
      </main>

      {/* Photos */}
      <div className="mt-6 rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Photos of the Night
          </h3>
          <span className="text-sm text-gray-400">{photoData.length} photos</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photoData.length > 0 ? (
            photoData.map((photo, i) => (
              <div
                key={i}
                className="aspect-square relative rounded-md overflow-hidden border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  layout="fill"
                  className="object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 col-span-full text-center">
              No photos yet.
            </p>
          )}
        </div>
      </div>

      {/* Tags + Merch */}
      <div className="mt-6 rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm hover:bg-purple-800/60 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          MERCH & TICKETS
        </h3>

        {merchItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {merchItems.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-md text-center hover:from-purple-800/60 hover:to-pink-800/60 cursor-pointer transition-all transform hover:scale-105 block"
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
