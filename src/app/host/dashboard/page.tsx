"use client";
import { useEffect, useState } from "react";
import Charts from "@/app/components/host/AnalyticsChart";
import EmailManager from "@/app/components/host/EmailManager";
import { EventPoster } from "@/app/components/user/Poster";

interface Event {
  name: string;
  date: string;
  total: number;
  rated: number;
}

interface Stats {
  upcomingEvents: number;
  topCity: string;
  interested: number;
}

export default function Dashboard() {
  const [posterData, setPosterData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    image: "/grainy-3.jpg",
  });

  const [stats, setStats] = useState<Stats>({
    upcomingEvents: 0,
    topCity: "",
    interested: 0,
  });

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [passedEvents, setPassedEvents] = useState<Event[]>([]); // not used visually yet but kept for completeness

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPosterData((prev) => ({ ...prev, [name]: value }));
  };

  async function createEvent() {
    if (
      !posterData.title ||
      !posterData.description ||
      !posterData.date ||
      !posterData.location
    ) {
      alert("Please fill in all required fields.");
      return; // Don't create the event if any required field is missing
    }

    await fetch("http://localhost:4000/create-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(posterData),
    });
    setPosterData({
      title: "",
      description: "",
      date: "",
      location: "",
      image: "/grainy-3.jpg",
    });
    alert("Event created successfully!");
  }

  async function getData() {
    try {
      const res = await fetch("http://localhost:4000/get-events");
      const data = await res.json();
      console.log(data.stats.topCity);
      setStats({
        upcomingEvents: data.stats.upcomingEvent,
        interested: data.stats.interested,
        topCity: data.stats.topCity,
      });
      setUpcomingEvents(data.upcomingEvents);
      setPassedEvents(data.passedEvents);
    } catch (error) {
      console.error("Error fetching event data:", error);
    }
  }

  useEffect(() => {
    const isLoggedIn = true;
    if (!isLoggedIn) {
      window.location.href = "/login";
    } else {
      getData();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-purple-700 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Event Dashboard</h1>
          <button className="bg-purple-900 px-3 py-1 rounded hover:bg-purple-800 text-sm">
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card title="Upcoming Events" value={String(stats.upcomingEvents)} />
          <Card
            title="Interested Attendees (This Week)"
            value={String(stats.interested)}
          />
          <Card title="Top City" value={stats.topCity} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          <div className="overflow-x-auto bg-white shadow-md rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Interested</th>
                  <th className="py-3 px-4">Liked</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.map((event, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-3 px-4 font-medium">{event.name}</td>
                    <td className="py-3 px-4">{event.date}</td>
                    <td className="py-3 px-4">{event.total}</td>
                    <td className="py-3 px-4">{event.rated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Create Event</h2>
          <div className="w-auto h-auto flex flex-col md:flex-row gap-4">
            <div className="md:w-1/2 h-full border border-gray-300 rounded-2xl p-4">
              <EventPoster
                description={posterData.description}
                image={posterData.image}
                title={posterData.title}
                date={posterData.date}
                location={posterData.location}
              />
            </div>
            <div className="md:w-1/2 bg-white shadow-md rounded-2xl p-6 space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    createEvent();
                    getData();
                  } catch (error) {
                    console.error("Failed to create event", error);
                    alert("Something went wrong.");
                  }
                }}
              >
                <div>
                  <label className="block font-medium">Title</label>
                  <input
                    name="title"
                    type="text"
                    value={posterData.title}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-medium">Date</label>
                  <input
                    name="date"
                    type="date"
                    value={posterData.date}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-medium">Location</label>
                  <input
                    name="location"
                    type="text"
                    value={posterData.location}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-medium">Description</label>
                  <textarea
                    name="description"
                    value={posterData.description}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
                  >
                    Submit Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
