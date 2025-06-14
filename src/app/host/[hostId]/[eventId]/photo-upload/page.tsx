"use client";

import React, { useState } from "react";
import { uploadPartyImage } from "@/app/lib/uploadImage";

type PhotoUploadProps = {
  eventId: string;
  hostId: string;
};

export default function PhotoUpload({ eventId, hostId }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const handleUpload = async () => {
    if (!file) {
      setStatus("error");
      console.error("No file selected.");
      return;
    }

    setStatus("uploading");

    await uploadPartyImage(file, eventId);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-2">Upload a Photo</h1>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block mb-3"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 transition-all"
        disabled={!file || status === "uploading"}
      >
        {status === "uploading" ? "Uploading..." : "Submit"}
      </button>
      {status === "success" && (
        <p className="text-green-500 mt-2">Photo uploaded for review!</p>
      )}
      {status === "error" && (
        <p className="text-red-500 mt-2">Upload failed. Try again.</p>
      )}
    </div>
  );
}
