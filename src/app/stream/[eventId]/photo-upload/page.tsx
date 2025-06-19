"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { uploadPartyImage } from "@/app/lib/photos/uploadImage";
import { addPhoto } from "@/app/lib/photos/photo";

export default function PhotoUpload() {
  const { eventId } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setStatus("idle");
  };

  const handleUpload = async () => {
    if (!file || !eventId) {
      setStatus("error");
      return;
    }

    try {
      setStatus("uploading");
      const url = await uploadPartyImage(file, eventId as string);
      await addPhoto(url, eventId as string);
      setStatus("success");
      setFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black thermal-background px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-purple-900/50 bg-black/60 p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
          📷 Upload a Photo
        </h1>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-purple-900/40 file:text-purple-300 hover:file:bg-purple-800/60 transition mb-4"
        />

        {file && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">Preview:</p>
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md border border-purple-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]"
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          className="w-full py-2 bg-purple-600 hover:bg-pink-600 text-white font-semibold rounded-md transition disabled:opacity-50"
        >
          {status === "uploading" ? "Uploading..." : "Submit"}
        </button>

        {status === "success" && (
          <p className="mt-4 text-green-400 text-center font-medium">
            Photo uploaded for review!
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-red-500 text-center font-medium">
            Upload failed. Try again.
          </p>
        )}
      </div>
    </div>
  );
}
