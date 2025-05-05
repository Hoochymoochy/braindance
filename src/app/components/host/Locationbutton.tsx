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
      <button onClick={handleClick} className="bg-blue-500 text-white p-2 rounded">
        Get Location
      </button>

      {coords && (
        <div className="mt-2">
          <p>Latitude: {coords.latitude}</p>
          <p>Longitude: {coords.longitude}</p>
          <button onClick={handleSend} className="mt-2 bg-green-500 text-white p-2 rounded">
            Send to Server
          </button>
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
