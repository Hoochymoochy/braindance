import { supabase } from "@/app/lib/utils/supabaseClient";

// Get the nearest city from coords
export async function getNearestCity(lat: number, lon: number) {
  const { data, error } = await supabase.rpc("get_nearest_city", {
    lat,
    lon,
  });

  if (error) throw new Error(`Failed to fetch city: ${error.message}`);
  if (!data || !data[0]?.city) return null;

  return {
    city: data[0].city,
    lat,
    lon,
  };
}

// Increment city view count for an event (expects client to handle cooldown!)
export async function incrementCityView(eventId: string, city: string) {
  const { error } = await supabase.rpc("increment_city_view", {
    event: eventId,
    cityname: city,
  });

  if (error) throw new Error(`Failed to increment view: ${error.message}`);
  return { success: true };
}

// Get the top city by views for an event
export async function getTopCity(eventId: string) {
  const { data, error } = await supabase
    .from("event_city_views")
    .select("city")
    .eq("event_id", eventId)
    .order("view_count", { ascending: false })
    .limit(1);

  if (error) throw new Error(`Failed to fetch top city: ${error.message}`);
  return data?.[0]?.city ?? null;
}
