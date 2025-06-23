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

  // Fetch all geo points
  const { data: geoPoints, error: geoError } = await supabase
    .from("event_city_geo")
    .select("lat, lon")
    .eq("event_id", eventId);

  if (geoError) throw new Error(`Failed to fetch geo: ${geoError.message}`);
  if (!geoPoints || geoPoints.length === 0) return [];

  // Fetch total views
  const { data: viewData, error: viewError } = await supabase
    .from("event_city_views")
    .select("view_count")
    .eq("event_id", eventId);

  if (viewError) throw new Error(`Failed to fetch views: ${viewError.message}`);

  const totalViews = viewData?.reduce((sum, row) => sum + (row.view_count ?? 0), 0) || 1; // avoid div/0

  // Count geo occurrences
  const pointMap: Record<string, number> = {};

  geoPoints.forEach((point: LatLon) => {
    const key = `${point.lat.toFixed(4)}_${point.lon.toFixed(4)}`; // round to cluster
    pointMap[key] = (pointMap[key] || 0) + 1;
  });

  // Format with weights
  return geoPoints.map((point: LatLon) => {
    const key = `${point.lat.toFixed(4)}_${point.lon.toFixed(4)}`;
    const weight = Math.min((pointMap[key] / totalViews) * 2, 1); // Scale and clamp

    return {
      lat: point.lat,
      lng: point.lon,
      weight: weight < 0.1 ? 0.1 : weight, // minimum visibility
    };
  });
}