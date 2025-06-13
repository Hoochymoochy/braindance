import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

export async function addLink(body: any, id: ParamValue) {
  const { error } = await supabase.from("links").insert({ event_id: id, label: body.label, description: body.text, link: body.url });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function getLinks(id: ParamValue) {
  const { data, error } = await supabase.from("links").select("*").eq("event_id", id);
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLink(id: ParamValue) {
  const { error } = await supabase.from("links").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}