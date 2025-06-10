"use client";
import { EventPoster } from "@/app/components/user/Poster";
import React, { useState, useRef } from "react";

export default function CreateEventForm({
  data,
  onChange,
  onCreate,
  onUpdate,
  onCancel,
  isEditing,
  ref,
  setImageFile,

}: {
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onCancel: () => void;
  isEditing: boolean;
  ref?: React.RefObject<HTMLDivElement>;
  setImageFile: (file: File | null) => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Handle files dropped or selected

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setImageFile(file); // pass up to Dashboard
  };
  
  

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <section ref={ref}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2 border border-card">
          <EventPoster {...data} hideStuff={{ bookmark: true, heart: true }} />
        </div>
        <div className="md:w-1/2 bg-black border-card shadow-md rounded-2xl p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              isEditing ? onUpdate() : onCreate();
            }}
          >
      {/* Drag & Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`mb-6 flex items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer ${
          dragActive ? "border-thermal-hot bg-thermal-hot/10" : "border-zinc-600"
        }`}
        onClick={() => inputRef.current?.click()}
      >

          <p className="text-zinc-400">Drag & drop a photo here, or click to upload</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
            {["title", "date", "location"].map((field) => (
              <div key={field}>
                <label className="block font-medium capitalize">{field}</label>
                <input
                  name={field}
                  type={field === "date" ? "date" : "text"}
                  value={(data as any)[field]}
                  onChange={onChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            ))}
            <div>
              <label className="block font-medium">Description</label>
              <textarea
                name="description"
                value={data.description}
                onChange={onChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="pt-4 flex gap-2">
              {isEditing && (
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
              >
                {isEditing ? "Update" : "Submit Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
