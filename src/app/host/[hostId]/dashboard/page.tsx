"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import StatsSection from "@/app/components/dashboard/StatsSection";
import EventsTable from "@/app/components/dashboard/EventsTable";
import CreateEventForm from "@/app/components/dashboard/CreateEventForm";
import {
  getEventsByHost,
  getEventById,
  updateEvent,
  createEvent,
  getPassedEvents,
} from "@/app/lib/events/event";
import { uploadEventImage } from "@/app/lib/photos/uploadImage";

const defaultPosterData = {
  title: "",
  description: "",
  date: "",
  location: "",
  image_url: "https://placeholder.pics/svg/300/000000/FFFFFF/Upload%20photo",
};

type passedEvent = {
  id: string;
  title: string;
  date: string;
  city: string;
  photo: number;
  view: number;
}

export default function Dashboard() {
  const params = useParams();
  const hostId = params?.hostId as string;
  const [posterData, setPosterData] = useState(defaultPosterData);
  const [stats, setStats] = useState({ photos: 0, topCity: "", views: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [passedEvents, setPassedEvents] = useState([]);
  const [editEvent, setEditEvent] = useState(false);
  const [eventId, setEventId] = useState(null);
  const eventsRef = useRef<HTMLDivElement>(null!);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const updateStats = (passedEvents: passedEvent[]) => {
    if (!passedEvents || passedEvents.length === 0) return;

    const photos = passedEvents.reduce((acc, event) => acc + (event.photo ?? 0), 0);
    const views = passedEvents.reduce((acc, event) => acc + (event.view ?? 0), 0);

    const cityMap = {};
    for (const event of passedEvents) {
      if (!event.city) continue;
      cityMap[event.city] = (cityMap[event.city] || 0) + event.view;
    }

    const topCity = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    setStats({
      photos,
      views,
      topCity,
    });
  };

  const fetchEvents = useCallback(async () => {
    if (!hostId) return;
    const events = await getEventsByHost(hostId);
    const passed = await getPassedEvents(hostId);

    updateStats(passed);
    setPassedEvents(passed);
    setUpcomingEvents(events);
  }, [hostId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPosterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = async () => {
    const { title, description, date, location } = posterData;

    if (!title || !description || !date || !location)
      return alert("Fill it all out fam.");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate < today)
      return alert("Date must be in the future.");

    try {
      const eventId = crypto.randomUUID();

      let imageUrl = posterData.image;
      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile, eventId);
      }

      const eventPayload = {
        ...posterData,
        image: imageUrl,
      };

      await createEvent(hostId, eventPayload);
      setPosterData(defaultPosterData);
      setImageFile(null);
      fetchEvents();
    } catch (err) {
      console.error("Error creating event:", err);
      alert("Something went wrong. Try again?");
    }
  };

  const handleGetEvent = async (id: string) => {
    const event = await getEventById(id);
    setPosterData(event);
    setEditEvent(true);
    setEventId(id);

    setTimeout(() => {
      eventsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleUpdateEvent = async () => {
    if (!eventId) return;
    await updateEvent(eventId, posterData);
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
          hostId={hostId}
          showActions
          onEdit={handleGetEvent}
          fetchEvents={fetchEvents}
          eventType="upcoming"
        />

        <EventsTable
          title="Passed Events"
          events={passedEvents}
          eventType="passed"
        />

        <CreateEventForm
          ref={eventsRef}
          data={posterData}
          onChange={handleChange}
          onCreate={handleCreateEvent}
          onUpdate={handleUpdateEvent}
          onCancel={cancelEdit}
          isEditing={editEvent}
          setImageFile={setImageFile}
        />
      </main>
    </div>
  );
}
