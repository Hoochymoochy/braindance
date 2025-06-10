"use client";

import { GET_ONE, DELETE } from "@/app/lib/event";
import { ParamValue } from "next/dist/server/request/params";
import { useRouter } from "next/navigation";


import React from "react";

export default function EventsTable({
  title,
  events,
  showActions = false,
  hostId,
  onEdit,
  fetchEvents,
}: {
  title: string;
  events: Event[];
  showActions?: boolean;
  hostId?: ParamValue;
  onEdit?: (id: string) => void;
  fetchEvents?: () => void;
}) {
    const router = useRouter();
  const onStart = async (eventId: string) => {
    router.push(`/host/${hostId}/${eventId}/stream`);
  };

  const onDelete = async (id: string) => {
    await DELETE(id);
    fetchEvents?.();
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="overflow-x-auto bg-black border-card shadow-lg rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="gradient-text  uppercase text-xs">
            <tr>
              <th className="py-3 px-5">Event</th>
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-5">{showActions ? "Interested" : "Viewed"}</th>
              <th className="py-3 px-5">Liked</th>
              {showActions && (
                <th className="py-3 px-5 text-center" colSpan={3}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {!events?.length ? (
              <tr>
                <td colSpan={showActions ? 7 : 4} className="py-4 px-5 text-center text-gray-400">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-t hover:bg-gray-50 transition">
                  <td className="py-4 px-5 font-medium text-white">{event.title}</td>
                  <td className="py-4 px-5 text-white">{event.date}</td>
                  <td className="py-4 px-5 text-center">{showActions ? event.intrested : event.viewed}</td>
                  <td className="py-4 px-5 text-center">{event.liked}</td>
                  {showActions && (
                    <>
                      <td className="py-4 px-2 text-center">
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                          onClick={() => onEdit?.(event.id)}
                        >
                          Edit
                        </button>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                          onClick={() => onStart(event.id)}
                        >
                          Start
                        </button>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                          onClick={() => onDelete?.(event.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
