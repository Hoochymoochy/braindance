"use client";
import { useEffect, useState } from "react";
import { Play, Users, Globe, Share, Heart, MessageSquare } from "lucide-react";
import Image from "next/image";
import GlobeHeatmap from "@/app/components/GlobeHeatmap";
import { useParams } from "next/navigation";
import { getStreams } from "@/app/lib/stream";
import { topCity } from "@/app/lib/location";
import { totalViews } from "@/app/lib/views";
import { getAcceptedPhotos } from "@/app/lib/photo";
export default function BraindanceUserStream() {
    const params = useParams();
    const eventId = params?.eventId;
  const [photoData, setPhotoData] = useState<
    { src: string; alt: string; }[]
  >([]);
  const [tags, setTags] = useState<string[]>([]);
  const [merchItems, setMerchItems] = useState<
    { title: string; subtitle: string }[]
  >([]);
  const [City, setTopCity] = useState<string>("");

  const [streams, setStreams] = useState("");
  const [views, setViews] = useState(0);

  const getDate = async () => {
    const stream = await getStreams(eventId);
    const city = await topCity(eventId);
    const views = await totalViews(eventId);
    const photos = await getAcceptedPhotos(eventId);

    const mappedPhotos = photos.map((photo: any) => ({
      src: photo.image_url,
      alt: `Uploaded photo ${photo.id}`, // You can customize this later
    }));

    console.log(photos);
    
    setTopCity(city);
    setViews(views);
    setStreams(stream[0].link);
    setPhotoData(mappedPhotos);
  }

  useEffect(() => {
    getDate();
  }, []);

  return (
    <div className="mx-auto p-10 bg-black thermal-background">
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5">
        {/* Left Column - Live Stream */}
        <div className="lg:col-span-2">
          <div className="relative rounded-lg overflow-hidden border border-purple-900/50 bg-black shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <div className="aspect-video relative">
              <iframe
                className="w-full h-full absolute top-0 left-0"
                src={`https://www.youtube.com/embed/${streams}?autoplay=1&mute=1`}
                title="YouTube Live Stream"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>

            {/* Info Panel */}
            <div className="p-4">
              <h2 className="text-xl font-bold">
                DJ Neon Pulse - Live from Club Vertex
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-xs font-bold">DJ</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Neon Pulse</p>
                  <p className="text-xs text-gray-400">Electronic / House</p>
                </div>
              </div>
            </div>

            {/* Action Buttons might add later again */}
            {/* <div className="absolute bottom-4 right-4 flex gap-2">
              {[Heart, MessageSquare, Share].map((Icon, idx) => (
                <button
                  key={idx}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-purple-900/70 transition-colors"
                >
                  <Icon
                    size={18}
                    className={
                      Icon === Heart
                        ? "text-pink-400"
                        : Icon === MessageSquare
                        ? "text-purple-400"
                        : "text-blue-400"
                    }
                  />
                </button>
              ))}
            </div> */}
          </div>
        </div>

        {/* Right Column - Stats */}
        <div>
          <div className="rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)] ">
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
                <p className="text-3xl font-bold text-pink-400">{City}</p>
              </div>
            </div>
            <GlobeHeatmap id={eventId} />

            {/* can add button in to hide and show the heatmap */}

            {/* <button className="w-full py-3 mt-4 rounded-md bg-purple-900/40 border border-purple-500/50 hover:bg-purple-800/60 transition-colors flex items-center justify-center gap-2 group">
              <Globe size={18} className="text-purple-400 group-hover:text-purple-300" />
              <span className="font-medium">heatmap / 3D globe</span>
            </button> */}
            {/* <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "PEAK VIEWERS", value: "0", color: "text-pink-300" },
                { label: "STREAM TIME", value: "0", color: "text-purple-300" },
              ].map(({ label, value, color }, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30"
                >
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </main>

      {/* Photo Gallery */}
      <div className="mt-6 rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Photos of the Night
          </h3>
          <span className="text-sm text-gray-400">
            {photoData.length} photos
          </span>
        </div>

        {/* Photo Grid - Larger Photos */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-2 w-full">
                    <div className="flex justify-between items-center">
                      <Heart size={14} className="text-pink-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 col-span-full text-center">
              No photos yet.
            </p>
          )}
        </div>
      </div>

      {/* Venue Tags / Shop Section */}
      <div className="mt-6 rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        {/* Tags */}
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

        {/* Merch */}
        <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          MERCH & TICKETS
        </h3>
        {merchItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {merchItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-md text-center hover:from-purple-800/60 hover:to-pink-800/60 cursor-pointer transition-all transform hover:scale-105"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-gray-400 mt-1">{item.subtitle}</p>
              </div>
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
