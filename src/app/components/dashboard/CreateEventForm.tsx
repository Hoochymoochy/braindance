"use client";

import { EventPoster } from "@/app/components/user/Poster";
import React, { useState, useRef } from "react";

// 🧠 Define the expected shape of the form data
type EventFormData = {
  title: string;
  date: string;
  location: string;
  description: string;
  image_url?: string | ArrayBuffer | null;
};

type CreateEventFormProps = {
  data: EventFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onCancel: () => void;
  isEditing: boolean;
  ref?: React.RefObject<HTMLDivElement>;
  setImageFile: (file: File | null) => void;
};

export default function CreateEventForm({
  data,
  onChange,
  onCreate,
  onUpdate,
  onCancel,
  isEditing,
  ref,
  setImageFile,
}: CreateEventFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({
        target: {
          name: "image_url",
          value: reader.result as string | ArrayBuffer | null,
        },
      } as React.ChangeEvent<HTMLInputElement>);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* Poster Preview */}
        <div className="md:w-1/2 border border-purple-900/30 bg-black/60 backdrop-blur-md rounded-xl shadow-[0_0_12px_rgba(168,85,247,0.1)] p-4">
        <EventPoster
          {...data}
          id="preview"
          image_url={typeof data.image_url === "string" ? data.image_url : "/placeholder.svg"}
          hideStuff={{ bookmark: true, heart: true }}
        />

        </div>

        {/* Form Panel */}
        <div className="md:w-1/2 border border-pink-500/20 bg-black/50 backdrop-blur-md rounded-xl shadow-[0_0_12px_rgba(236,72,153,0.15)] p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isEditing) {
                onUpdate();
              } else {
                onCreate();
              }
            }}
            className="space-y-4"
          >
            {/* Upload Box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex items-center justify-center text-center border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors ${
                dragActive
                  ? "border-pink-500 bg-pink-500/10"
                  : "border-zinc-600 hover:border-purple-500"
              }`}
            >
              <p className="text-sm text-gray-400">
                Drag & drop a photo here, or click to upload
              </p>
              <input
                ref={inputRef}
                name="image"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Input Fields */}
            {["title", "date", "location"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-purple-300 capitalize mb-1">
                  {field}
                </label>
                <input
                  name={field}
                  type={field === "date" ? "date" : "text"}
                  onChange={onChange}
                  className="w-full px-4 py-2 bg-black border border-purple-500/30 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            ))}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={data.description}
                onChange={onChange}
                className="w-full px-4 py-2 bg-black border border-purple-500/30 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[100px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              {isEditing && (
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 transition"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-pink-500 transition"
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
