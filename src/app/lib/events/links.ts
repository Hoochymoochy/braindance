import { supabase } from "@/app/lib/utils/supabaseClient";

// Link input shape
type LinkInput = {
  label: string;
  description: string;
  link: string;
};

// Add a link to an event
export async function addLink(eventId: string, body: LinkInput) {
  const { error } = await supabase.from("links").insert({
    event_id: eventId,
    label: body.label,
    description: body.description,
    link: body.link,
  });

  if (error) throw new Error(`Link insert failed: ${error.message}`);
  return { success: true };
}

// Get all links for a specific event
export async function getLinks(eventId: string) {
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("event_id", eventId);

  if (error) throw new Error(`Failed to fetch links: ${error.message}`);
  return data;
}

// Delete a link by ID
export async function deleteLink(linkId: string) {
  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", linkId);

  if (error) throw new Error(`Failed to delete link: ${error.message}`);
  return { success: true };
}
