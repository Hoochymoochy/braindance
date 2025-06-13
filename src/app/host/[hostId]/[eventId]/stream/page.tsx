"use client";
import {
  Play,
  Users,
  Globe,
  X,
  Check,
  Share,
  Heart,
  MessageSquare,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";

import VenueLinks from "@/app/components/host/VenueLinks";
import { addStream, getStreams } from "@/app/lib/stream";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { get } from "http";

// Mock GlobeHeatmap component since it's not available
const GlobeHeatmap = () => (
  <div className="w-full h-32 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg flex items-center justify-center border border-purple-500/30">
    <Globe className="text-purple-400" size={32} />
  </div>
);

export default function BraindanceMockup() {
  const params = useParams();
  const eventId = params?.eventId;
  const [pendingPhotos, setPendingPhotos] = useState([
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
      alt: "Concert crowd with lights",
      reviewed: false,
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      alt: "DJ performing",
      reviewed: false,
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1571266028243-d220c9efe0ab?w=400&h=300&fit=crop",
      alt: "DJ booth setup",
      reviewed: false,
    },
  ]);

  const [approvedPhotos, setApprovedPhotos] = useState([
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
      alt: "Music festival lights",
    },
    {
      id: 5,
      src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop",
      alt: "Concert stage",
    },
    {
      id: 6,
      src: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop",
      alt: "Dancing crowd",
    },
  ]);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reviewStats, setReviewStats] = useState({
    reviewed: 0,
    approved: 3,
    rejected: 0,
  });
  const [showAnimation, setShowAnimation] = useState("");

  const currentPhoto = pendingPhotos[currentPhotoIndex];
  const totalPhotos = pendingPhotos.length + approvedPhotos.length;

  // Function to approve photo (placeholder for your implementation)
  const approvePhoto = () => {
    if (!currentPhoto) return;

    setShowAnimation("approve");
    setTimeout(() => {
      const photoToApprove = { ...currentPhoto };
      setApprovedPhotos((prev) => [...prev, photoToApprove]);
      setPendingPhotos((prev) =>
        prev.filter((photo) => photo.id !== currentPhoto.id)
      );
      setReviewStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        approved: prev.approved + 1,
      }));
      setCurrentPhotoIndex((prev) => Math.min(prev, pendingPhotos.length - 2));
      setShowAnimation("");
    }, 500);
  };

    const [url, setUrl] = useState("");

  const extractVideoId = (fullUrl: string) => {
    try {
      const urlObj = new URL(fullUrl);
      if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.slice(1); // youtu.be/VIDEO_ID
      }
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v"); // youtube.com/watch?v=VIDEO_ID
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inputUrl = formData.get("url") as string;
    const videoId = extractVideoId(inputUrl);
    if (videoId) {
      setUrl(videoId);
      await addStream(videoId, eventId);
    } else {
      alert("Invalid YouTube URL");
    }
  };

  // Function to reject photo (placeholder for your implementation)
  const rejectPhoto = () => {
    if (!currentPhoto) return;

    setShowAnimation("reject");
    setTimeout(() => {
      setPendingPhotos((prev) =>
        prev.filter((photo) => photo.id !== currentPhoto.id)
      );
      setReviewStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        rejected: prev.rejected + 1,
      }));
      setCurrentPhotoIndex((prev) => Math.min(prev, pendingPhotos.length - 2));
      setShowAnimation("");
    }, 500);
  };

  useEffect(() => {
    getStreams(eventId).then((data) => {
      setUrl(data[0].link);
    })
    
  }, [pendingPhotos]);

  const progressPercentage =
    totalPhotos > 0 ? (approvedPhotos.length / totalPhotos) * 100 : 0;

  return (
    <div className="min-h-screen bg-black p-4 md:p-10">
      <div className="container mx-auto">
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Live Stream + Photo Review */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Live Stream */}
          <div className="relative rounded-lg overflow-hidden border border-purple-900/50 bg-black shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <div className="aspect-video relative">
              {url ? (
                <iframe
                  className="w-full h-full absolute top-0 left-0"
                  src={`https://www.youtube.com/embed/${url}?autoplay=1&mute=1`}
                  title="YouTube Live Stream"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="text"
                      name="url"
                      placeholder="Enter YouTube URL"
                      className="px-4 py-2 rounded-lg bg-gray-800 text-white w-72"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Go Live
                    </button>
                  </form>
                </div>
              )}
            </div>

              {/* Info Panel */}
              <div className="p-4">
                <h2 className="text-xl font-bold text-white">
                  DJ Neon Pulse - Live from Club Vertex
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-xs font-bold">DJ</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Neon Pulse</p>
                    <p className="text-xs text-gray-400">Electronic / House</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Review Tool */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">
                  Photo Review Tool
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {reviewStats.reviewed} reviewed
                  </span>
                  <span className="text-sm text-green-400">
                    {reviewStats.approved} approved
                  </span>
                  <span className="text-sm text-red-400">
                    {reviewStats.rejected} rejected
                  </span>
                </div>
              </div>

              {currentPhoto ? (
                <>
                  <div
                    className={`aspect-video relative rounded-md overflow-hidden mb-4 transition-all duration-500 ${
                      showAnimation === "approve"
                        ? "ring-4 ring-green-500 scale-105"
                        : showAnimation === "reject"
                        ? "ring-4 ring-red-500 scale-95"
                        : ""
                    }`}
                  >
                    <img
                      src={currentPhoto.src}
                      alt={currentPhoto.alt}
                      className="w-full h-full object-cover"
                    />
                    {showAnimation === "approve" && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <Check className="text-green-400" size={64} />
                      </div>
                    )}
                    {showAnimation === "reject" && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <X className="text-red-400" size={64} />
                      </div>
                    )}
                  </div>

                  {/* Photo counter */}
                  <div className="flex justify-center mb-4">
                    <span className="text-sm text-gray-400">
                      Photo {currentPhotoIndex + 1} of {pendingPhotos.length}{" "}
                      pending
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-center gap-6">
                    <button
                      onClick={rejectPhoto}
                      disabled={showAnimation !== ""}
                      className="w-16 h-16 rounded-full bg-red-900/50 border-2 border-red-500 flex items-center justify-center hover:bg-red-800 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <X
                        className="text-red-400 group-hover:text-red-300"
                        size={28}
                      />
                    </button>
                    <button
                      onClick={approvePhoto}
                      disabled={showAnimation !== ""}
                      className="w-16 h-16 rounded-full bg-green-900/50 border-2 border-green-500 flex items-center justify-center hover:bg-green-800 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Check
                        className="text-green-400 group-hover:text-green-300"
                        size={28}
                      />
                    </button>
                  </div>

                  {/* Keyboard shortcuts hint */}
                  <div className="mt-4 flex justify-center gap-6 text-xs text-gray-500">
                    <span>Press X to reject</span>
                    <span>Press C to approve</span>
                  </div>
                </>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-800 rounded-md">
                  <div className="text-center">
                    <Eye className="mx-auto mb-2 text-gray-600" size={48} />
                    <p className="text-gray-400">No photos pending review</p>
                    <p className="text-sm text-gray-500 mt-1">All caught up!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats + Photo Gallery */}
          <div className="flex flex-col gap-4">
            {/* Stats Panel */}
            <div className="rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                TOP STATS
              </h3>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-400">Current Viewers</p>
                  <p className="text-3xl font-bold text-purple-400">1,247</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active City</p>
                  <p className="text-xl font-bold text-pink-400">LA</p>
                </div>
              </div>
              <GlobeHeatmap />

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  {
                    label: "PEAK VIEWERS",
                    value: "2,891",
                    color: "text-pink-300",
                  },
                  {
                    label: "STREAM TIME",
                    value: "2:34h",
                    color: "text-purple-300",
                  },
                ].map(({ label, value, color }, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30"
                  >
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex-grow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">
                  Photos of the Night
                </h3>
                <span className="text-sm text-gray-400">
                  {approvedPhotos.length}/{totalPhotos}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full mb-4">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              {/* Upload Area */}
              <div className="mb-4 p-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-purple-500 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 text-gray-600" size={24} />
                  <p className="text-sm text-gray-400">
                    Drag photos here or{" "}
                    <button className="text-purple-400 hover:text-purple-300">
                      browse
                    </button>
                  </p>
                </div>
              </div>

              {/* Photo Grid */}
              {approvedPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {approvedPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="aspect-square relative rounded-sm overflow-hidden border border-green-500/30 group"
                    >
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      />
                      <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="text-white" size={12} />
                      </div>
                      {/* Photo overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="text-white" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <EyeOff className="mx-auto mb-2 text-gray-600" size={32} />
                  <p className="text-gray-400">No approved photos yet</p>
                  <p className="text-sm text-gray-500">
                    Start reviewing to build your gallery!
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>{" "}
        <VenueLinks id={eventId} />
      </div>
    </div>
  );
}
