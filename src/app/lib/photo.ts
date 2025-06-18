import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

export async function addPhoto(url: any, id: ParamValue) {
  const { error } = await supabase.from("moderation_photos").insert({ event_id: id, image_url: url });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function deletePhoto(id: ParamValue) {
  const { error } = await supabase.from("moderation_photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function getPhotos(id: ParamValue) {
  const { data, error } = await supabase.from("moderation_photos").select("*").eq("event_id", id);
  if (error) throw new Error(error.message);
  return data;
}


export async function acceptPhoto(url: any, id: ParamValue) {
  const { error } = await supabase.from("accepted_photos").update({ image_url: url }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}