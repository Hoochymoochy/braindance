"use client";
import { useEffect } from "react";
import Charts from "../../components/AnalyticsChart";
import Email from "../../components/EmailManager";
import EmailManager from "../../components/EmailManager";
export default function Dashboard() {
  useEffect(() => {
    // Protect route (add real auth check later)
    const isLoggedIn = true; // Replace with real session check
    if (!isLoggedIn) {
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Topbar */}
      <header className="bg-purple-700 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Nightclub Dashboard</h1>
          <button className="bg-purple-900 px-3 py-1 rounded hover:bg-purple-800 text-sm">
            Log Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Analytics Overview */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card title="Upcoming Events" value="4" />
          <Card title="Tickets Sold (This Week)" value="1,234" />
          <Card title="Revenue" value="$18,720" />
        </section>

        {/* Event List */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          <div className="overflow-x-auto bg-white shadow-md rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Tickets Sold</th>
                  <th className="py-3 px-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Techno Rave",
                    date: "Apr 25",
                    tickets: 320,
                    revenue: "$4,800",
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
        <Charts />
        <EmailManager />
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
