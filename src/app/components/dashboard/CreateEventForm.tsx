"use client";

import { EventPoster } from "@/app/components/user/Poster";
import React, { useState, useRef } from "react";

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
  creating?: boolean;
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
  creating,
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

  // 🔥 Helper to ensure clean string values
  const getFieldValue = (field: keyof EventFormData) => {
    const value = data[field];
    return typeof value === "string" ? value : "";
  };

  return (
    <section ref={ref}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Poster Preview */}
        <div className="glass-bends-card md:w-1/2 rounded-xl p-4">
          <EventPoster
            {...data}
            id="preview"
            image_url={
              typeof data.image_url === "string"
                ? data.image_url
                : "/placeholder.svg"
            }
            hideStuff={{ bookmark: true, heart: true }}
          />
        </div>

        {/* Form Panel */}
        <div className="glass-bends-card md:w-1/2 space-y-4 rounded-xl p-6">
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
              className={`flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors ${
                dragActive
                  ? "border-[#ff00f7] bg-[#ff00f7]/10"
                  : "border-white/20 hover:border-[#00ccff]/55"
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
            {(["title", "date", "location"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium capitalize text-[#00ccff]/90">
                  {field}
                </label>
                <input
                  name={field}
                  type={field === "date" ? "date" : "text"}
                  value={getFieldValue(field)}
                  onChange={onChange}
                  className="input-bends"
                />
              </div>
            ))}

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#00ccff]/90">
                Description
              </label>
              <textarea
                name="description"
                value={getFieldValue("description")}
                onChange={onChange}
                className="input-bends min-h-[100px] resize-y py-3"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              {isEditing && (
                <button
                  type="button"
                  className="rounded-md border border-white/20 px-4 py-2 text-white/80 transition hover:bg-white/10"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="rounded-md bg-[#3700ff] px-4 py-2 text-white transition hover:bg-[#ff00f7]/85 disabled:opacity-50"
                disabled={creating}
              >
                {creating ? "Creating..." : isEditing ? "Update" : "Submit Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
