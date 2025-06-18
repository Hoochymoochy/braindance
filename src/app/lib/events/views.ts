import { supabase } from "@/app/lib/utils/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

export async function totalViews(id: ParamValue): Promise<number> {
  const { data, error } = await supabase
    .from("event_city_views")
    .select("view_count")
    .eq("event_id", id);

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) return 0;

  return data.reduce((sum, row) => sum + (row.view_count ?? 0), 0);
}
