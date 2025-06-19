import { supabase } from "@/app/lib/utils/supabaseClient";

// Type for geo input
type GeoPoint = {
  lat: number;
  lon: number;
};

// Add geo point to event
export async function addGeo(eventId: string, lat: any, lon: any) {
  const { error } = await supabase.from("event_city_geo").insert({
    event_id: eventId,
    lat: lat,
    lon: lon,
  });

  if (error) throw new Error(`Geo insert failed: ${error.message}`);
  return { success: true };
}

// Get all geo points for an event, formatted for heatmap
export async function getAllGeo(eventId: string) {
  if (!eventId) return [];

  const { data, error } = await supabase
    .from("event_city_geo")
    .select("lat, lon")
    .eq("event_id", eventId);

  if (error) throw new Error(`Failed to fetch geo: ${error.message}`);
  if (!data) return [];

  return data
    .filter((point) => point.lat !== null && point.lon !== null)
    .map((point) => ({
      lat: point.lat,
      lng: point.lon, // transform for Globe
      weight: 0.1,
    }));
}
