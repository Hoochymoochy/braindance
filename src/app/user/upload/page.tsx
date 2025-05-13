"use client";
import { Play, Users, Globe, Share, Heart, MessageSquare } from "lucide-react";
import Image from "next/image";
import PhotoUpload from "@/app/components/photouploade";

export default function BraindanceUserStream() {
  return (
    <div className="min-h-screen bg-[#0a0014] text-white font-sans">
      <PhotoUpload eventId="1" hostId="1" />
    </div>
  );
}
