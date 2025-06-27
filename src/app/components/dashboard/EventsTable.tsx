"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "@/app/lib/events/event";
import { ParamValue } from "next/dist/server/request/params";
import { MoreVertical } from "lucide-react";

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  image_url?: string;
  stream_url?: string;
  intrested?: number;
  viewed?: number;
  liked?: number;
}

interface PassedEvent {
  id: string;
  title: string;
  image_url?: string;
  city: string;
  view: number;
  photo: number;
  liked?: number;
}

type Event = UpcomingEvent | PassedEvent;

export default function EventsTable({
  title,
  events,
  eventType = "upcoming",
  showActions = false,
  hostId,
  onEdit,
  fetchEvents,
}: {
  title: string;
  events: Event[];
  eventType?: "upcoming" | "passed" | "live";
  showActions?: boolean;
  hostId?: ParamValue;
  onEdit?: (id: string) => void;
  fetchEvents?: () => void;
}) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const onStart = (eventId: string) => router.push(`/host/${hostId}/${eventId}/stream`);
  const onDelete = async (id: string, url: string) => {
    await deleteEvent(id, url, hostId as string);
    fetchEvents?.();
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="border border-purple-900/30 bg-black/60 rounded-2xl shadow-[0_0_12px_rgba(168,85,247,0.1)]">
        <table className="min-w-full text-sm text-white">
          <thead className="uppercase text-xs text-purple-300 bg-black border-b border-purple-900/30">
            <tr>
              <th className="py-3 px-5 text-left">Event</th>
              {eventType === "passed" ? (
                <>
                  <th className="py-3 px-5 text-left">Top City</th>
                  <th className="py-3 px-5 text-center">Views</th>
                  <th className="py-3 px-5 text-center">Photos</th>
                </>
              ) : (
                <>
                  <th className="py-3 px-5 text-left">Date</th>
                  <th className="py-3 px-5 text-left">Location</th>
                </>
              )}
              {eventType === "live" && (
                <th className="py-3 px-5 text-center">Stream</th>
              )}
              {showActions && (
                <th className="py-3 px-5 text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {!events?.length ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-zinc-400"
                >
                  No events found.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-t border-purple-900/30 hover:bg-purple-900/10 transition"
                >
                  <td className="py-4 px-5 font-semibold">{event.title}</td>

                  {(eventType === "upcoming" || eventType === "live") && (
                    <>
                      <td className="py-4 px-5">{(event as UpcomingEvent).date}</td>
                      <td className="py-4 px-5">{(event as UpcomingEvent).location}</td>
                    </>
                  )}

                  {eventType === "passed" && (
                    <>
                      <td className="py-4 px-5">{(event as PassedEvent).city}</td>
                      <td className="py-4 px-5 text-center">{(event as PassedEvent).view}</td>
                      <td className="py-4 px-5 text-center">{(event as PassedEvent).photo}</td>
                    </>
                  )}

                  {eventType === "live" && (
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => onStart(event.id)}
                        className="bg-purple-700/30 hover:bg-purple-700/50 transition text-white text-xs font-medium px-4 py-2 rounded-xl"
                      >
                        Join Stream
                      </button>
                    </td>
                  )}

                  {showActions && (
                    <td className="py-4 px-5 text-center relative">
                      <button
                        className="p-2 rounded hover:bg-purple-800/30 transition"
                        onClick={() => toggleMenu(event.id)}
                      >
                        <MoreVertical className="h-5 w-5 text-purple-300" />
                      </button>

                      {openMenuId === event.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-black border border-purple-900/40 rounded-md shadow-xl z-10 animate-fadeIn">
                          <button
                            onClick={() => {
                              onEdit?.(event.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-purple-700/30 text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              onStart(event.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-purple-700/30 text-sm"
                          >
                            🚀 Start
                          </button>
                          <button
                            onClick={() => {
                              onDelete(event.id, event.image_url ?? "");
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </td>
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
