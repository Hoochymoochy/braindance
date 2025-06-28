"use client";

import { useEffect, useState } from "react";
import { getNearestCity } from "../lib/utils/location";
export default function LocationGate() {
  const [locationReady, setLocationReady] = useState(false);
  const [fallbackVisible, setFallbackVisible] = useState(false);

  const isIOS = typeof window !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as any)?.MSStream;

  const setLocation = async (lat: number, lng: number) => {
    try {
      const data = await getNearestCity(lat, lng);
      if (data?.city) {
        localStorage.setItem("city", data.city);
        localStorage.setItem("lat", lat.toString());
        localStorage.setItem("lon", lng.toString());
        setLocationReady(true);
        setFallbackVisible(false);
      }
    } catch (err) {
      console.error("🔥 Supabase error:", err);
    }
  };

  const requestGeo = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
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

    if (!isIOS) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("⚠️ Auto geolocation failed:", error);
          setFallbackVisible(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      // Don't even try auto on iOS
      setFallbackVisible(true);
    }
  }, []);

  if (!locationReady && fallbackVisible) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold text-white mb-4">📍 Enable Location</h2>
        <p className="text-white mb-6">
          Safari needs you to tap below to unlock location.
        </p>
        <button
          onClick={requestGeo}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full font-semibold text-lg"
        >
          Enable Location
        </button>
      </div>
    );
  }

  return null;
}
