"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // 👈 ADD THIS
import { motion } from "framer-motion";
import { MapPin, Flame, Users } from "lucide-react";
import { Card, CardContent } from "@/app/components/user/Card";
import { Button } from "@/app/components/user/Button";
import YouTubeEmbed from "@/app/components/user/Youtube";

export default function BraindanceStreamPage() {
  const [shouldUnmute, setShouldUnmute] = useState(false);
  const [url, setUrl] = useState("");

  const searchParams = useSearchParams(); // 👈 READ URL PARAMS
  const host_id = searchParams.get("host_id");
  const id = searchParams.get("id");

  useEffect(() => {
    fetch(`http://localhost:4000/stream?host=${host_id}&id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.streamUrl);
        setUrl(data.streamUrl);
      });
  });
  return (
    <>
      <YouTubeEmbed videoId={url} triggerUnmute={shouldUnmute} />

      {/* Maybe you want to show Host info somewhere? */}
      <div>
        <p>Host: {host_id}</p>
        <p>Stream ID: {id}</p>
      </div>

      <div onClick={() => setShouldUnmute(true)}>
        {/* This could be a cool intro animation or hidden zone */}
        Click to Enter (or any aesthetic touch you want)
      </div>
    </>
  );
}
