"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StatsSection from "@/app/components/dashboard/StatsSection";
import EventsTable from "@/app/components/dashboard/EventsTable";
import CreateEventForm from "@/app/components/dashboard/CreateEventForm";
import { GET, GET_ONE, POST, PATCH, DELETE } from "@/app/lib/event";

const defaultPosterData = { title: "", description: "", date: "", location: "", image: "/grainy-3.jpg" };

export default function Dashboard() {
  const { id: hostId } = useParams();
  const [posterData, setPosterData] = useState(defaultPosterData);
  const [stats, setStats] = useState({ upcomingEvents: 0, topCity: "", interested: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [passedEvents, setPassedEvents] = useState([]);
  const [editEvent, setEditEvent] = useState(false);
  const [eventId, setEventId] = useState(null);

  const splitEventsByDate = (events) => {
    const now = new Date();
    setUpcomingEvents(events.filter(event => new Date(event.date) > now));
    setPassedEvents(events.filter(event => new Date(event.date) <= now));
  };

  const fetchEvents = async () => {
    if (!hostId) return;
    const events = await GET(hostId);
    splitEventsByDate(events);
  };

  useEffect(() => {
    fetchEvents();
  }, [hostId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPosterData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = async () => {
    const { title, description, date, location } = posterData;
    if (!title || !description || !date || !location) return alert("Fill it all out fam.");
    await POST(posterData, hostId);
    setPosterData(defaultPosterData);
    fetchEvents();
  };

  const handleGetEvent = async (id) => {
    const event = await GET_ONE(id);
    setPosterData(event);
    setEditEvent(true);
    setEventId(id);
  };

  const handleUpdateEvent = async () => {
    if (!eventId) return;
    await PATCH(eventId, posterData);
    cancelEdit();
    fetchEvents();
  };

  const cancelEdit = () => {
    setEditEvent(false);
    setEventId(null);
    setPosterData(defaultPosterData);
  };

  return (
    <div className="min-h-screen thermal-background">
      <main className="max-w-6xl mx-auto p-6 space-y-8 pt-10">
        <StatsSection stats={stats} />
        <EventsTable
          title="Upcoming Events"
          events={upcomingEvents}
          showActions
          onEdit={handleGetEvent}
          fetchEvents={fetchEvents}
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
