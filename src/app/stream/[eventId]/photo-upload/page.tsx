"use client";

import React, { useState } from "react";
import { uploadPartyImage } from "@/app/lib/photos/uploadImage";
import { addPhoto } from "@/app/lib/photos/photo";
import { useParams } from "next/navigation";

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
      setFile(null); // Reset after upload
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus("error");
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto flex flex-col items-center space-y-4">
      <h1 className="text-xl font-bold">📷 Upload a Photo</h1>

    <input
      type="file"
      accept="image/*"
      capture="environment" // 👈 this is the key for using the rear cam
      onChange={handleChange}
      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition"
    />

      <button
        onClick={handleUpload}
        disabled={!file || status === "uploading"}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50"
      >
        {status === "uploading" ? "Uploading..." : "Submit"}
      </button>

      {status === "success" && (
        <p className="text-green-500 font-medium">Photo uploaded for review!</p>
      )}
      {status === "error" && (
        <p className="text-red-500 font-medium">Upload failed. Try again.</p>
      )}
    </div>
  );
}
