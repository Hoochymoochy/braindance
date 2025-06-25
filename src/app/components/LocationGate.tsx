"use client";

import { useEffect } from "react";
import { getNearestCity } from "../lib/utils/location";

export default function LocationGate() {
  const setLocation = async (lat: number, lng: number) => {
    const data = await getNearestCity(lat, lng);

    localStorage.setItem("city", data?.city);
    localStorage.setItem("lat", lat.toString());
    localStorage.setItem("lon", lng.toString());
  }

  useEffect(() => {
    if (!navigator.geolocation) {
    console.log("Geolocation not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLocation(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      console.error("Location error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
  }, []);

  return null;
}
