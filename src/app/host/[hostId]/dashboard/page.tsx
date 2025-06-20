"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StatsSection from "@/app/components/dashboard/StatsSection";
import EventsTable from "@/app/components/dashboard/EventsTable";
import CreateEventForm from "@/app/components/dashboard/CreateEventForm";
import { getEventsByHost, getEventById, updateEvent, createEvent } from "@/app/lib/events/event";
import { uploadEventImage } from "@/app/lib/photos/uploadImage";


const defaultPosterData = { title: "", description: "", date: "", location: "", image_url: "https://placeholder.pics/svg/300/000000/FFFFFF/Upload%20photo" };

export default function Dashboard() {
  const params = useParams();
  const hostId = params?.hostId as string;
  const [posterData, setPosterData] = useState(defaultPosterData);
  const [stats, setStats] = useState({ upcomingEvents: 0, topCity: "", interested: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [passedEvents, setPassedEvents] = useState([]);
  const [editEvent, setEditEvent] = useState(false);
  const [eventId, setEventId] = useState(null);
  const eventsRef = useRef<HTMLDivElement>(null!);
  const [imageFile, setImageFile] = useState<File | null>(null);


  const splitEventsByDate = (events) => {
    const now = new Date();
    setUpcomingEvents(events.filter(event => new Date(event.date) > now));
    setPassedEvents(events.filter(event => new Date(event.date) <= now));
  };

  const fetchEvents = async () => {
    if (!hostId) return;
    const events = await getEventsByHost(hostId);
    splitEventsByDate(events);
  };

  useEffect(() => {
    fetchEvents();
  }, [hostId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value);
    setPosterData(prev => ({ ...prev,  [name]: value }));
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
      return alert("Date must in the future.");
  
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
  
  
  const handleGetEvent = async (id) => {
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
        />
        <EventsTable title="Passed Events" events={passedEvents} />
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
