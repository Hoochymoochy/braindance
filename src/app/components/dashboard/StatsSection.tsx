import React from "react";
import Card from "./EventCard";

interface Stats {
  upcomingEvents: number;
  topCity: string;
  interested: number;
}

export default function StatsSection({ stats }: { stats: Stats }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Card title="Upcoming Events" value={String(stats.upcomingEvents ?? 0)} />
      <Card title="Interested Attendees (This Week)" value={String(stats.interested ?? 0)} />
      <Card title="Top City" value={stats.topCity?.trim() || "N/A"} />
    </section>
  );
}
