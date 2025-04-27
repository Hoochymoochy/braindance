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
}

interface Stats {
  upcomingEvents: number;
  topCity: string;
  interested: number;
}

export default function Dashboard() {
  const params = useParams();
  const hostId = params?.id as string;

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
  const [passedEvents, setPassedEvents] = useState<Event[]>([]);

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
      return;
    }

    const response = await fetch(
      `http://localhost:4000/create-event?host=${hostId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...posterData }),
      }
    );

    console.log(await response.json());

    setPosterData({
      title: "",
      description: "",
      date: "",
      location: "",
      image: "/grainy-3.jpg",
    });

    getData();

    alert("Event created successfully!");
  }

  async function getData() {
    try {
      const res = await fetch(
        `http://localhost:4000/get-events?host=${hostId}`
      );

      const data = await res.json();
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

  async function handleStart(){

  }

  function handleDelete(id: string) {
    fetch(`http://localhost:4000/delete-event/${id}`, {
      method: "DELETE",
    }).then(() => {
      getData();
    });
  }

  function handleLike(id: string) {
    fetch(`http://localhost:4000/like-event/${id}`, {
      method: "POST",
    }).then(() => {
      getData();
    });
  }

  useEffect(() => {
    const isLoggedIn = true;
    if (!isLoggedIn) {
      window.location.href = "/login";
    } else if (hostId) {
      getData();
    }
  }, [hostId]);

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

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="py-3 px-5">Event</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Interested</th>
                  <th className="py-3 px-5">Liked</th>
                  <th className="py-3 px-5 text-center" colSpan={3}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.map((event, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50 transition">
                    <td className="py-4 px-5 font-medium text-gray-800">
                      {event.title}
                    </td>
                    <td className="py-4 px-5 text-gray-600">{event.date}</td>
                    <td className="py-4 px-5 text-center">{event.intrested}</td>
                    <td className="py-4 px-5 text-center">{event.liked}</td>
                    <td className="py-4 px-2 text-center">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600">
                        Edit
                      </button>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <button className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600">
                        Start
                      </button>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <button className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Passed Events</h2>
          <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="py-3 px-5">Event</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Viewed</th>
                  <th className="py-3 px-5">Liked</th>
                </tr>
              </thead>
              <tbody>
                {passedEvents.map((event, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50 transition">
                    <td className="py-4 px-5 font-medium text-gray-800">
                      {event.title}
                    </td>
                    <td className="py-4 px-5 text-gray-600">{event.date}</td>
                    <td className="py-4 px-5 text-center">{event.viewed}</td>
                    <td className="py-4 px-5 text-center">{event.liked}</td>
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
                    await createEvent();
                    await getData();
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
