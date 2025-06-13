import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

export async function addTag(tag: any, id: ParamValue) {
  const { error } = await supabase.from("tags").insert({ event_id: id, tag: tag });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function getTags(id: ParamValue) {
  const { data, error } = await supabase.from("tags").select("*").eq("event_id", id);
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTag(id: ParamValue) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}