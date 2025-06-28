"use client";

import { X, Check, Eye, EyeOff } from "lucide-react";
import VenueLinks from "@/app/components/host/VenueLinks";
import { addStream, getStreams } from "@/app/lib/events/stream";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  getPhotos,
  deletePhoto,
  acceptPhoto,
  getAcceptedPhotos,
} from "@/app/lib/photos/photo";
import GlobeHeatmap from "@/app/components/GlobeHeatmap";
import { totalViews } from "@/app/lib/events/views";
import { getTopCity } from "@/app/lib/utils/location";

interface Photo {
  id: number;
  image_url: string;
  event_id: string;
}

export default function BraindanceMockup() {
  const params = useParams();
  const eventId = params?.eventId as string;

  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<Photo[]>([]);
  const [city, setCity] = useState("");
  const [views, setViews] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reviewStats, setReviewStats] = useState({
    reviewed: 0,
    approved: 0,
    rejected: 0,
  });
  const [showAnimation, setShowAnimation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState("");

  const currentPhoto = pendingPhotos[currentPhotoIndex];
  const totalPhotos = pendingPhotos.length + approvedPhotos.length;

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pending, approved] = await Promise.all([
        getPhotos(eventId),
        getAcceptedPhotos(eventId),
      ]);
      setPendingPhotos(pending);
      setApprovedPhotos(approved);
      setReviewStats((prev) => ({ ...prev, approved: approved.length }));
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const getData = useCallback(async () => {
    try {
      const streams = await getStreams(eventId);
      if (streams?.length > 0) setUrl(streams[0].link);
      setViews(await totalViews(eventId));
      setCity(await getTopCity(eventId));
    } catch (error) {
      console.error("Error loading streams:", error);
    }
  }, [eventId]);

  const extractVideoId = (fullUrl: string) => {
    try {
      const urlObj = new URL(fullUrl);
  
      // Handles youtu.be short links
      if (urlObj.hostname === "youtu.be") return urlObj.pathname.slice(1);
  
      // Handles youtube.com/watch?v=ID
      if (urlObj.hostname.includes("youtube.com")) {
        const videoId = urlObj.searchParams.get("v");
        if (videoId) return videoId;
  
        // Handles youtube.com/live/ID
        if (urlObj.pathname.startsWith("/live/")) {
          return urlObj.pathname.split("/live/")[1];
        }
      }
  
      return null;
    } catch {
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
      await addStream(eventId, videoId);
    } else {
      alert("Invalid YouTube URL");
    }
  };

  const approvePhoto = useCallback(async () => {
    if (!currentPhoto) return;
  
    // Check if approved photos count is already 25 or more
    if (approvedPhotos.length >= 25) {
      alert("🔥 Photo limit reached! Only 25 approved photos allowed.");
      return; // Stop the approval right here, no cap breakin'
    }
  
    setShowAnimation("approve");
    try {
      await acceptPhoto(currentPhoto.image_url, eventId);
      await deletePhoto(currentPhoto.id.toString());
      setTimeout(() => {
        const photoToApprove = { ...currentPhoto, status: "approved" as const };
        setApprovedPhotos((prev) => [...prev, photoToApprove]);
        setPendingPhotos((prev) => prev.filter((p) => p.id !== currentPhoto.id));
        setReviewStats((prev) => ({
          ...prev,
          reviewed: prev.reviewed + 1,
          approved: prev.approved + 1,
        }));
        setCurrentPhotoIndex((prev) => Math.min(prev, pendingPhotos.length - 2));
        setShowAnimation("");
      }, 500);
    } catch (error) {
      console.error("Error approving photo:", error);
      setShowAnimation("");
      alert("Error approving photo. Please try again.");
    }
  }, [currentPhoto, eventId, pendingPhotos.length, approvedPhotos.length]);
  

    const handleCopy = (path: string) => {
    const fullUrl = `https://braindance.live/${path}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      alert(`Copied: ${fullUrl}`);
    }).catch((err) => {
      console.error("Copy failed:", err);
      alert("Failed to copy link.");
    });
  };


  const rejectPhoto = useCallback(async () => {
    if (!currentPhoto) return;
    setShowAnimation("reject");
    try {
      await deletePhoto(currentPhoto.id.toString());
      setTimeout(() => {
        setPendingPhotos((prev) => prev.filter((p) => p.id !== currentPhoto.id));
        setReviewStats((prev) => ({
          ...prev,
          reviewed: prev.reviewed + 1,
          rejected: prev.rejected + 1,
        }));
        setCurrentPhotoIndex((prev) => Math.min(prev, pendingPhotos.length - 2));
        setShowAnimation("");
      }, 500);
    } catch (error) {
      console.error("Error rejecting photo:", error);
      setShowAnimation("");
      alert("Error rejecting photo. Please try again.");
    }
  }, [currentPhoto, pendingPhotos.length]);

  useEffect(() => {
    if (eventId) {
      getData();
      loadPhotos();
    }
  }, [eventId, getData, loadPhotos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAnimation || !currentPhoto) return;
      if (e.key.toLowerCase() === "x") rejectPhoto();
      if (e.key.toLowerCase() === "c") approvePhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPhoto, showAnimation, approvePhoto, rejectPhoto]);

  const maxPhotos = 24;
  const progressPercentage = (approvedPhotos.length / maxPhotos) * 100;


  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen thermal-background p-4 md:p-10">
      <div className="container mx-auto">
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Live Stream + Photo Review */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 items-center justify-start">
            <button
              onClick={() => handleCopy(`stream/${eventId}`)}
              className="px-4 py-2 rounded-md bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium shadow-md transition-all"
            >
              Copy Stream Link
            </button>
            <button
              onClick={() => handleCopy(`stream/${eventId}/photo-upload`)}
              className="px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium shadow-md transition-all"
            >
              Copy Photo Upload Link
            </button>
          </div>

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
            <div className="rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]p-4">
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
                    <Image
                      src={currentPhoto.image_url}
                      alt={`Photo ${currentPhoto.id}`}
                      fill
                      className="object-cover rounded-md"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
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
                      Photo {currentPhotoIndex + 1} of {pendingPhotos.length} pending
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
                      disabled={showAnimation !== "" || approvedPhotos.length >= 25}
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
                <p className="text-sm text-gray-400">Total Viewers</p>
                  <p className="text-3xl font-bold text-purple-400">{views}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Top City</p>
                  <p className="text-xl font-bold text-pink-400">{city}</p>
                </div>
              </div>
              <GlobeHeatmap id={eventId} />

            </div>

            {/* Photo Gallery */}
            <div className="rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)] flex-grow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">
                  Photos of the Night
                </h3>
                <span className="text-sm text-gray-400">
                  {approvedPhotos.length}/{maxPhotos}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full mb-4">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              {/* Photo Grid */}
              {approvedPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {approvedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square relative rounded-sm overflow-hidden border border-green-500/30 group"
                    >
                    <Image
                      src={photo.image_url}
                      alt={`Approved photo ${photo.id}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-200"
                      sizes="(max-width: 768px) 100vw, 33vw"
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
        </main>
        <VenueLinks id={eventId} />
      </div>
    </div>
  );
}