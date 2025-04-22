"use client";
import { useEffect, useState } from "react";
import Charts from "@/app/components/host/AnalyticsChart";
import EmailManager from "@/app/components/host/EmailManager";
import { EventPoster } from "@/app/components/user/Poster";

export default function Dashboard() {
  const [posterData, setPosterData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    image: "/grainy-3.jpg",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPosterData((prev) => ({ ...prev, [name]: value }));
  };

  async function fetchEvents() {
    const res = await fetch("http://localhost:4000/", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const events = await res.json();
    return events;
  }

  useEffect(() => {
    // Protect route (add real auth check later)
    const isLoggedIn = true;
    if (!isLoggedIn) {
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
          <Card title="Upcoming Events" value="" />
          <Card title="Intrested Attendees (This Week)" value="" />
          <Card title="Top city" value="" />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          <div className="overflow-x-auto bg-white shadow-md rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Intrested</th>
                  <th className="py-3 px-4">Liked</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Techno Rave",
                    date: "Apr 25",
                    rated: "4.5",
                    total: "$4,800",
                  },
                  {
                    name: "House of Bass",
                    date: "Apr 27",
                    tickets: 500,
                    revenue: "$7,500",
                  },
                  {
                    name: "Neon Nights",
                    date: "May 3",
                    tickets: 250,
                    revenue: "$3,750",
                  },
                  {
                    name: "Latin Heat",
                    date: "May 10",
                    tickets: 164,
                    revenue: "$2,460",
                  },
                ].map((event, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-3 px-4 font-medium">{event.name}</td>
                    <td className="py-3 px-4">{event.date}</td>
                    <td className="py-3 px-4">{event.tickets}</td>
                    <td className="py-3 px-4">{event.revenue}</td>
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
                onSubmit={(e) => {
                  e.preventDefault();
                  // Submit logic here
                  console.log("Form submitted:", posterData);
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
                  <label className="block font-medium">Description</label>
                  <textarea
                    name="description"
                    value={posterData.description}
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
