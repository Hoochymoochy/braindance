import { EventPoster } from "@/app/components/user/Poster";
import React from "react";

export default function CreateEventForm({
  data,
  onChange,
  onCreate,
  onUpdate,
  onCancel,
  isEditing,
}: {
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onCancel: () => void;
  isEditing: boolean;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Event" : "Create Event"}</h2>
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
