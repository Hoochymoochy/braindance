import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

// CREATE EVENT
export async function getLocation(lon: any, lat: any) {
  const { data,error } = await supabase.rpc("get_nearest_city", {lon: lat, lat: lon,});
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data && data[0]?.city) { 
    localStorage.setItem("userCity", data[0].city);
    // localStorage.setItem("lon", lat);
    // localStorage.setItem("lat", lon);
   }
  return NextResponse.json({ success: true });
}

export async function addCount(id: ParamValue) {
  const city = localStorage.getItem("userCity");

  if (city) {
    await supabase.rpc("increment_city_view", {
      event: id,
      cityname: city,
    });
  }
  return NextResponse.json({ success: true });
}

export async function topCity(id: ParamValue) {
  const { data, error } = await supabase
    .from("event_city_views")
    .select("city")
    .eq("event_id", id)
    .order("view_count", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  console.log(data);

  return data[0].city
}
