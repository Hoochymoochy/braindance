"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Flame, Users } from "lucide-react";
import { Card, CardContent } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import YouTubeEmbed from "@/app/components/Youtube";


export default function BraindanceStreamPage() {
  return(
  <div>
    <YouTubeEmbed videoId="67f9t5bPyQY" />
  </div>
  )
}
