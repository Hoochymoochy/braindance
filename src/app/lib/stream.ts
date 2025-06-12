import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

export async function addStream(url: any, id: ParamValue) {
    const { error } = await supabase.from("streams").insert({ event_id: id, link: url });
    console.log(id + " " + url);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function getStreams(id: ParamValue) {
    const { data, error } = await supabase.from("streams").select("link").eq("event_id", id);
    if (error) throw new Error(error.message);
    return data;
}