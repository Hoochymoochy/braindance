import React, { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient"; // <-- your Supabase client
import axios from "axios";

const PhotoUpload = ({
  eventId,
  hostId,
}: {
  eventId: string;
  hostId: string;
}) => {
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

    const fileExt = file.name.split(".").pop();
    const filePath = `event-${eventId}/${hostId}-${Date.now()}.${fileExt}`;

    try {
      const { data, error: uploadError } = await supabase.storage
        .from("moderation-photos")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        setStatus("error");
        return;
      }

      if (!data) {
        console.error("No data returned from Supabase upload");
        setStatus("error");
        return;
      }

      console.log("Upload successful:", data);

      // Uncomment if you're saving path to your backend
      await axios.post("http://localhost:4000/api/photo/upload", {
        eventId,
        hostId,
        filePath,
      });

      setStatus("success");
      setFile(null);
    } catch (err: any) {
      console.error("Unexpected upload error:", err?.message || err);
      setStatus("error");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl mb-2">Upload a Photo</h1>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        className="mt-3 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!file || status === "uploading"}
      >
        {status === "uploading" ? "Uploading..." : "Submit"}
      </button>
      {status === "success" && (
        <p className="text-green-500 mt-2">Photo uploaded for review!</p>
      )}
      {status === "error" && (
        <p className="text-red-500 mt-2">Upload failed.</p>
      )}
    </div>
  );
};

export default PhotoUpload;
