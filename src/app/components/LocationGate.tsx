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
      <div
        className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center text-center p-8"
        style={{
          WebkitTapHighlightColor: "transparent",
          pointerEvents: "auto",
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">🌍 Enable Location</h2>
        <p className="text-white mb-6">
          Tap below to turn on location and show nearby events.
        </p>
        <button
          onClick={requestGeo}
          className="bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-lg transition-all duration-200"
          style={{
            WebkitTapHighlightColor: "transparent",
            pointerEvents: "auto",
          }}
        >
          Enable Location
        </button>
      </div>
    );
  }
  

  return null;
}
