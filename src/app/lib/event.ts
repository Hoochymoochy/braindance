import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

// CREATE EVENT
export async function POST(body: any, id: ParamValue) {
  const { error } = await supabase.from("events").insert({ host_id: id, title: body.title, description: body.description, date: body.date, location: body.location, image_url: body.image,  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET ALL EVENTS
export async function GET(hostId: string) {
  const { data, error } = await supabase.from("events").select("*").eq("host_id", hostId);
  if (error) throw new Error(error.message);
  return data;
}

// GET SINGLE EVENT
export async function GET_ONE(id: String) {
  const { data, error } = await supabase.from("events").select("*").eq("id", id);
  if (error) throw new Error(error.message);
  return data;
}

// UPDATE EVENT
export async function PATCH(id: string, body: any) {
  const { error } = await supabase.from("events").update({ title: body.title, description: body.description, date: body.date, location: body.location, image_url: body.image }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}


// DELETE EVENT
export async function DELETE(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
  return { success: true };
}

export async function getGlobalEvents() {
  const { data, error } = await supabase.from("events").select("*");
  if (error) throw new Error(error.message);
  return data;
}
