import { supabase } from "@/app/lib/utils/supabaseClient";

// Add a new tag to an event
export async function addTag(eventId: string, tag: string) {
  const { error } = await supabase.from("tags").insert({
    event_id: eventId,
    tag,
  });

  if (error) throw new Error(`Failed to add tag: ${error.message}`);
  return { success: true };
}

// Get all tags for an event
export async function getTags(eventId: string) {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("event_id", eventId);

  if (error) throw new Error(`Failed to fetch tags: ${error.message}`);
  return data;
}

// Delete a tag by ID
export async function deleteTag(tagId: string) {
  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) throw new Error(`Failed to delete tag: ${error.message}`);
  return { success: true };
}
