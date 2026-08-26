"use client";

import { useGeolocation } from "@/app/hooks/useGeolocation";

export default function LocationButton() {
  const { coords, error, getLocation } = useGeolocation();

  const handleClick = async () => {
    getLocation();
  };

  const handleSend = async () => {
    if (coords) {
      alert("Location sent!");
    }
  };

  return (
    <div className="p-4">
      <button onClick={handleClick} className="rounded bg-blue-500 p-2 text-zinc-950">
        Get Location
      </button>

      {coords && (
        <div className="mt-2">
          <p>Latitude: {coords.latitude}</p>
          <p>Longitude: {coords.longitude}</p>
          <button onClick={handleSend} className="mt-2 rounded bg-green-500 p-2 text-zinc-950">
            Send to Server
          </button>
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
