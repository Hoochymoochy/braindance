import { supabase } from "@/app/lib/utils/supabaseClient";

// Add a stream URL to an event
export async function addStream(eventId: string, link: string, platform: string) {
  const { error } = await supabase.from("streams").insert({
    event_id: eventId,
    link: link,
    platform: platform
  });

  if (error) throw new Error(`Failed to add stream: ${error.message}`);
  return { success: true };
}

// Get all stream links for an event
export async function getStreams(eventId: string) {
  const { data, error } = await supabase
    .from("streams")
    .select("link, platform")
    .eq("event_id", eventId);

  if (error) throw new Error(`Failed to fetch streams: ${error.message}`);
  return data;
}
