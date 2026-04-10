"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { uploadPartyImage } from "@/app/lib/photos/uploadImage";
import Image from "next/image";
import { addPhoto, getAcceptedPhotos } from "@/app/lib/photos/photo";

export default function PhotoUpload() {
  const { eventId } = useParams();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxPhotos = 24;
  const isAtLimit = acceptedCount >= maxPhotos;

  // Load accepted photos count on mount or eventId change
  useEffect(() => {
    if (!eventId) return;
    
    (async () => {
      try {
        const acceptedPhotos = await getAcceptedPhotos(eventId as string);
        setAcceptedCount(acceptedPhotos.length);
      } catch (err) {
        console.error("Failed to load accepted photos count:", err);
      }
    })();
  }, [eventId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAtLimit) return;
    setFile(e.target.files?.[0] || null);
    setStatus("idle");
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isAtLimit) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setStatus("idle");
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAtLimit) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleUpload = async () => {
    if (!file || !eventId || isAtLimit) {
      setStatus("error");
      return;
    }

    try {
      setStatus("uploading");
      const progressInterval = simulateProgress();

      const url = await uploadPartyImage(file, eventId as string);
      await addPhoto(url, eventId as string);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Refresh accepted count after upload to keep UI in sync
      const acceptedPhotos = await getAcceptedPhotos(eventId as string);
      setAcceptedCount(acceptedPhotos.length);

      setTimeout(() => {
        setStatus("success");
        setFile(null);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus("error");
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    if (isAtLimit) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 text-white">
      <div className="glass-bends w-full max-w-md transform rounded-lg p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_28px_rgba(0,204,255,0.12)]">
        
        {/* Photo Counter */}
        <div className="text-center mb-4">
          <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-all duration-300 ${
            isAtLimit 
              ? "border-[#ff00f7]/45 bg-[#ff00f7]/15 text-[#ff00f7]" 
              : "border-[#00ccff]/35 bg-[#00ccff]/10 text-[#00ccff]"
          }`}>
            <span className="mr-2">{isAtLimit ? "🔥" : "📸"}</span>
            {acceptedCount} / {maxPhotos} photos
          </div>
        </div>

        <h1
          className={`mb-6 bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-center text-2xl font-bold text-transparent transition-all duration-300 ${
            isAtLimit ? "" : "animate-pulse"
          }`}
        >
          {isAtLimit ? "🎉 Gallery Complete!" : "📷 Upload a Photo"}
        </h1>

        {/* Gallery Full Message */}
        {isAtLimit && (
          <div className="glass-bends-card mb-6 animate-fade-in rounded-lg border border-[#ff00f7]/25 p-4">
            <div className="text-center">
              <div className="mb-2 text-3xl">🎊</div>
              <p className="mb-1 font-medium text-[#ff00f7]">Photo gallery is complete!</p>
              <p className="text-sm text-white/70">
                The party has reached the maximum of {maxPhotos} photos for this event.
              </p>
            </div>
          </div>
        )}

        {/* Drag and Drop Zone */}
        {!isAtLimit && (
          <div
            className={`relative mb-4 cursor-pointer rounded-lg border-2 border-dashed p-6 transition-all duration-300 ${
              isDragOver
                ? "scale-105 border-[#00ccff] bg-[#00ccff]/10"
                : "border-white/15 hover:border-[#00ccff]/50 hover:bg-[#3700ff]/10"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={triggerFileInput}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />

            <div className="text-center">
              <div
                className={`text-4xl mb-2 transition-transform duration-300 ${
                  isDragOver ? "scale-125" : ""
                }`}
              >
                {isDragOver ? "⬇️" : "📁"}
              </div>
              <p className="mb-1 text-sm text-[#00ccff]/90">
                {isDragOver ? "Drop your photo here!" : "Click to select or drag & drop"}
              </p>
              <p className="text-gray-500 text-xs">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        )}

        {/* Gallery Full Alternative Actions */}
        {isAtLimit && (
          <div className="mb-4 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="flex w-full transform items-center justify-center rounded-md bg-[#3700ff] px-4 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-[#ff00f7]/85 hover:shadow-[0_0_20px_rgba(0,204,255,0.2)] active:scale-95"
            >
              <span className="mr-2">🔄</span>
              Refresh Gallery
            </button>
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Want to upload more? Contact the event organizer to increase the photo limit.
              </p>
            </div>
          </div>
        )}

        {/* Preview - Only show if not at limit */}
        {file && !isAtLimit && (
          <div className="mb-4 animate-fade-in">
            <p className="text-sm text-gray-400 mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Preview:
            </p>
            <div className="relative group">
              <div className="group-hover:scale-[1.02] relative h-48 w-full overflow-hidden rounded-md border border-[#00ccff]/25 shadow-[0_0_12px_rgba(0,204,255,0.12)] transition-transform duration-300">
                <Image
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setStatus("idle");
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">{file.name}</p>
          </div>
        )}

        {/* Upload Progress Bar */}
        {status === "uploading" && !isAtLimit && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-[#00ccff]/85">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button - Only show if not at limit */}
        {!isAtLimit && (
          <button
            onClick={handleUpload}
            disabled={!file || status === "uploading"}
            className={`w-full py-3 font-semibold rounded-md transition-all duration-300 transform ${
              !file || status === "uploading"
                ? "cursor-not-allowed bg-gray-600 text-gray-400 opacity-50"
                : "bg-[#3700ff] text-white hover:scale-105 hover:bg-[#ff00f7]/85 hover:shadow-[0_0_20px_rgba(0,204,255,0.15)] active:scale-95"
            }`}
          >
            {status === "uploading" ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "✨ Submit Photo"
            )}
          </button>
        )}

        {/* Status Messages */}
        {status === "success" && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-md animate-bounce-in">
            <p className="text-green-400 text-center font-medium flex items-center justify-center">
              <span className="text-xl mr-2">🎉</span>
              Photo uploaded for review!
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-md animate-shake">
            <p className="text-red-400 text-center font-medium flex items-center justify-center">
              <span className="text-xl mr-2">❌</span>
              Upload failed. Try again.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { opacity: 1; transform: scale(1.1) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}