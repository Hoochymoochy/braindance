"use client";

import { useEffect, useState } from "react";
import { getNearestCity } from "../lib/utils/location";

export default function LocationGate() {
  const [locationReady, setLocationReady] = useState(false);
  const [fallbackVisible, setFallbackVisible] = useState(false);

  const setLocation = async (lat: number, lon: number) => {
    try {
      console.log("📡 Got coords:", lat, lon);
      const data = await getNearestCity(lat, lon);
      console.log("🏙️ Nearest city:", data);

      if (data?.city) {
        localStorage.setItem("city", data.city);
        localStorage.setItem("lat", lat.toString());
        localStorage.setItem("lon", lon.toString());
        setLocationReady(true);
        setFallbackVisible(false);
      } else {
        console.warn("⚠️ No city returned from getNearestCity");
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
        localStorage.setItem("locationClicked", "true");
      },
      (error) => {
        console.error("❌ Manual location error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    // Already got location? No need to ask again
    const cachedLat = localStorage.getItem("lat");
    const cachedLon = localStorage.getItem("lon");

    if (cachedLat && cachedLon) {
      console.log("📦 Using cached location.");
      setLocationReady(true);
      return;
    }

    const isIOS =
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !("MSStream" in window);

    if (!navigator.geolocation) {
      console.log("🚫 Geolocation not supported.");
      return;
    }

    if (isIOS) {
      console.log("🍏 iOS detected — showing manual fallback.");
      setFallbackVisible(true);
      return;
    }

    // For other browsers, try auto-fetch
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("✅ Auto location success:", position);
        setLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("⚠️ Auto location failed:", error);
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
      <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold text-white mb-4">📍 Enable Location</h2>
        <p className="text-white mb-6">
          Tap below to share your location. If you blocked it before, go to your browser settings to re-enable it.
        </p>
        <button
          onClick={requestGeo}
          className="bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-lg transition-all duration-200"
        >
          Enable Location
        </button>
      </div>
    );
  }

  return null;
}
