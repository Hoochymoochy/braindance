import React, { useState } from "react";
import axios from "axios";

const PhotoUpload = ({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", eventId);
    formData.append("userId", userId);

    try {
      await axios.post("/api/photos/upload", formData);
      setStatus("success");
    } catch (err) {
      console.error(err);
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
