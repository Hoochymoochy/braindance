import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";


export async function totalViews(id: ParamValue) {
  const { data, error } = await supabase
    .from("event_city_views")
    .select("view_count")
    .eq("event_id", id)
    .order("view_count", { ascending: false });

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) return {  total: 0 };

  const total = data.reduce((sum, row) => sum + (row.view_count || 0), 0);
  return total
}

