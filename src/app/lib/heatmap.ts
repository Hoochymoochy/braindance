import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

export async function addGeo(id: ParamValue) {
    const lon = localStorage.getItem("lon");
    const lat = localStorage.getItem("lat");
  const { error } = await supabase.from("event_city_geo").insert({ lon: lon, lat: lat, event_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function getAllGeo(id: ParamValue) {
  if (!id || typeof id !== "string") return [];

  const { data, error } = await supabase
    .from("event_city_geo")
    .select("lon, lat")
    .eq("event_id", id);

  if (error) {
    console.error("Failed to fetch geo data:", error.message);
    throw new Error(error.message);
  }

  if (!data) return [];

  // Map lon -> lng and add default weight
  const formatted = data
    .filter((point) => point.lat !== null && point.lon !== null)
    .map((point) => ({
      lat: point.lat,
      lng: point.lon,
      weight: 1,
    }));

  return formatted;
}