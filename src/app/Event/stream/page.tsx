"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Flame, Users } from "lucide-react";
import { Card, CardContent } from "@/app/components/user/Card";
import { Button } from "@/app/components/user/Button";
import YouTubeEmbed from "@/app/components/user/Youtube";

export default function BraindanceStreamPage() {
  const [shouldUnmute, setShouldUnmute] = useState(false);

  return (
    <>
      <YouTubeEmbed videoId="67f9t5bPyQY" triggerUnmute={shouldUnmute} />
      <div onClick={() => setShouldUnmute(true)}>
        {/* This could be a cool intro animation or hidden zone */}
        Click to Enter (or any aesthetic touch you want)
      </div>
    </>
  );
}
