"use client";

import { useEffect, useState } from "react";
import { getNearestCity } from "../lib/utils/location";

export default function LocationGate() {
  const [locationReady, setLocationReady] = useState(false);
  const [fallbackVisible, setFallbackVisible] = useState(false);

  const setLocation = async (lat: number, lng: number) => {
    console.log("📡 Got coords:", lat, lng);
    try {
      const data = await getNearestCity(lat, lng);
      console.log("🏙️ Nearest city:", data);

      if (data?.city) {
        localStorage.setItem("city", data.city);
        localStorage.setItem("lat", lat.toString());
        localStorage.setItem("lon", lng.toString());
        setLocationReady(true);
        setFallbackVisible(false);
      } else {
        console.warn("⚠️ No city found");
      }
    } catch (err) {
      console.error("🔥 Supabase error:", err);
    }
  };

  const requestGeo = () => {
    console.log("👆 Manual location request triggered");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("✅ Manual location success:", position);
        setLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("❌ Manual location error:", {
          name: error.code,
          message: error.message,
          code: error.code,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("🚫 Geolocation not supported.");
      return;
    }

    console.log("🌍 Attempting auto-location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("✅ Auto location success:", position);
        setLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("⚠️ Auto location failed, showing fallback:", {
          name: error.code,
          message: error.message,
          code: error.code,
        });
        setFallbackVisible(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  if (!locationReady && fallbackVisible) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-2xl font-bold mb-4">🌍 Enable Location</h2>
        <p className="mb-6 text-zinc-300">
          We need your location to show nearby events and unlock the full experience.
        </p>
        <button
          onClick={requestGeo}
          className="bg-pink-600 hover:bg-pink-700 transition px-6 py-3 rounded-full font-semibold text-lg"
        >
          Enable Location
        </button>
      </div>
    );
  }

  return null;
}
