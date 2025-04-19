"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Flame, Users, Youtube } from "lucide-react";
import { Card, CardContent } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import Heat from "@/app/components/GlobeHeatmap"
import YouTubeEmbed from "../components/Youtube";

export default function HeatmapPage() {
  return(
      <div>
        <YouTubeEmbed videoId="https://www.youtube.com/watch?v=Zwff14h-lLo"/>
  </div>
  )
}
