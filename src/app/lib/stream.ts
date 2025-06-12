import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

// CREATE EVENT
export async function addStream(url: any, id: ParamValue) {
    const { error } = await supabase.from("events").insert({ id: id, link: url });
    console.log(id + " " + url);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
