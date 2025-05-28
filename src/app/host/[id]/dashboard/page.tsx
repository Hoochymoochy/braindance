"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Charts from "@/app/components/host/AnalyticsChart";
import EmailManager from "@/app/components/host/EmailManager";
import { EventPoster } from "@/app/components/user/Poster";

interface Event {
  title: string;
  date: string;
  intrested: number;
  liked: number;
  viewed: number;
  id: number;
}

interface Stats {
  upcomingEvents: number;
  topCity: string;
  interested: number;
}

const defaultPosterData = {
  title: "",
  description: "",
  date: "",
  location: "",
  image: "/grainy-3.jpg",
};

export default function Dashboard() {
  const { id: hostId } = useParams() as { id: string };

  const [posterData, setPosterData] = useState(defaultPosterData);
  const [stats, setStats] = useState<Stats>({
    upcomingEvents: 0,
    topCity: "",
    interested: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [passedEvents, setPassedEvents] = useState<Event[]>([]);
  const [editEvent, setEditEvent] = useState(false);
  const [eventId, setEventId] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPosterData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchEventsData = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/events/get-events?host=${hostId}`
      );
      const data = await res.json();

      console.log(data);
      setStats(data.stats);
      setUpcomingEvents(data.upcomingEvents);
      setPassedEvents(data.passedEvents);
    } catch (error) {
      console.error("Error fetching event data:", error);
    }
  };

  const handleCreateEvent = async () => {
    const { title, description, date, location } = posterData;

    if (!title || !description || !date || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      await fetch(
        `http://localhost:4000/api/events/create-event?host=${hostId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(posterData),
        }
      );

      setPosterData(defaultPosterData);
      fetchEventsData();
      alert("Event created successfully!");
    } catch (error) {
      console.error("Create event failed:", error);
    }
  };

  const handleGetEvent = async (id: number) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/events/get-event?host=${hostId}&id=${id}`
      );
      const data = await res.json();

      setEditEvent(true);
      setEventId(id);
      setPosterData(data);
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    await fetch(
      `http://localhost:4000/api/events/delete-event?host=${hostId}&id=${id}`,
      {
        method: "DELETE",
      }
    );

    fetchEventsData();
  };

  const handleUpdateEvent = async () => {
    if (!eventId) return;

    await fetch(
      `http://localhost:4000/api/events/update-event?host=${hostId}&id=${eventId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(posterData),
      }
    );

    cancelEdit();
    fetchEventsData();
  };

  const cancelEdit = () => {
    setEditEvent(false);
    setEventId(null);
    setPosterData(defaultPosterData);
  };

  useEffect(() => {
    if (!hostId) return;
    fetchEventsData();
  }, [hostId]);

  return (
    <div className="min-h-screen thermal-background">
      <main className="max-w-6xl mx-auto p-6 space-y-8 pt-10">
        <StatsSection stats={stats} />
        <EventsTable
          title="Upcoming Events"
          events={upcomingEvents}
          showActions
          onEdit={handleGetEvent}
          onDelete={handleDeleteEvent}
        />
        <EventsTable title="Passed Events" events={passedEvents} />
        <CreateEventForm
          data={posterData}
          onChange={handleChange}
          onCreate={handleCreateEvent}
          onUpdate={handleUpdateEvent}
          onCancel={cancelEdit}
          isEditing={editEvent}
        />
      </main>
    </div>
  );
}

function StatsSection({ stats }: { stats: Stats }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Card
        title="Upcoming Events"
        value={
          stats?.upcomingEvents != null ? String(stats.upcomingEvents) : "0"
        }
      />
      <Card
        title="Interested Attendees (This Week)"
        value={stats?.interested != null ? String(stats.interested) : "0"}
      />
      <Card
        title="Top City"
        value={stats?.topCity?.trim() ? stats.topCity : "N/A"}
      />
    </section>
  );
}

function EventsTable({
  title,
  events,
  showActions = false,
  onEdit,
  onDelete,
}: {
  title: string;
  events: Event[];
  showActions?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-white uppercase text-xs">
            <tr>
              <th className="py-3 px-5">Event</th>
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-5">
                {showActions ? "Interested" : "Viewed"}
              </th>
              <th className="py-3 px-5">Liked</th>
              {showActions && (
                <th className="py-3 px-5 text-center" colSpan={3}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {!events || events.length === 0 ? (
              <tr>
                <td
                  colSpan={showActions ? 7 : 4}
                  className="py-4 px-5 text-center"
                >
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="py-4 px-5 font-medium text-white">
                    {event.title}
                  </td>
                  <td className="py-4 px-5 text-white">{event.date}</td>
                  <td className="py-4 px-5 text-center">
                    {showActions ? event.intrested : event.viewed}
                  </td>
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
                        <button className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600">
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

function CreateEventForm({
  data,
  onChange,
  onCreate,
  onUpdate,
  onCancel,
  isEditing,
}: {
  data: typeof defaultPosterData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onCancel: () => void;
  isEditing: boolean;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? "Edit Event" : "Create Event"}
      </h2>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2 border border-gray-300 rounded-2xl p-4">
          <EventPoster {...data} hideStuff={{ bookmark: true, heart: true }} />
        </div>
        <div className="md:w-1/2 bg-white shadow-md rounded-2xl p-6 space-y-4">
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

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-black p-5 rounded-xl shadow-md">
      <h3 className="text-sm text-white">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
