"use client";
import { useState } from "react";

export default function EventForm({
  onSubmit,
}: {
  onSubmit: (data: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title, date, image };
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-xl shadow"
    >
      <div>
        <label className="block text-sm font-medium">Event Title</label>
        <input
          className="mt-1 w-full border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Date</label>
        <input
          type="date"
          className="mt-1 w-full border rounded p-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Photo</label>
        <input
          type="file"
          accept="image/*"
          className="mt-1"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
      </div>
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Save Event
      </button>
    </form>
  );
}
