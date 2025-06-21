import { supabase } from "@/app/lib/utils/supabaseClient";

// Define proper types
type LatLon = {
  lat: number;
  lon: number;
};

type HeatmapPoint = {
  lat: number;
  lng: number;
  weight: number;
};

// Add geo point to event
export async function addGeo(eventId: string, lat: number, lon: number) {
  const { error } = await supabase.from("event_city_geo").insert({
    event_id: eventId,
    lat,
    lon,
  });

  if (error) throw new Error(`Geo insert failed: ${error.message}`);
  return { success: true };
}

// Get all geo points for an event, formatted for heatmap
export async function getAllGeo(eventId: string): Promise<HeatmapPoint[]> {
  if (!eventId) return [];

  const { data, error } = await supabase
    .from("event_city_geo")
    .select("lat, lon")
    .eq("event_id", eventId);

  if (error) throw new Error(`Failed to fetch geo: ${error.message}`);
  if (!data) return [];

  return data
    .filter((point: Partial<LatLon>) => point.lat !== null && point.lon !== null)
    .map((point: LatLon) => ({
      lat: point.lat,
      lng: point.lon,
      weight: 0.1,
    }));
}
