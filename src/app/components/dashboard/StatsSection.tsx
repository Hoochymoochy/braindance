import React from "react";
import Card from "./EventCard";

interface Stats {
  photos: number;
  topCity: string;
  views: number;
}

export default function StatsSection({ stats }: { stats: Stats }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Card title="Total Photos Uploaded" value={String(stats.photos ?? 0)} />
      <Card title="Total Views" value={String(stats.views ?? 0)} />
      <Card title="Top City" value={stats.topCity?.trim() || "N/A"} />
    </section>
  );
}
