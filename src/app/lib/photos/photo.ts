import { supabase } from "@/app/lib/utils/supabaseClient";

// Add photo to moderation queue
export async function addPhoto(imageUrl: string, eventId: string) {
  const { error } = await supabase.from("moderation_photos").insert({
    event_id: eventId,
    image_url: imageUrl,
  });

  if (error) throw new Error(`Failed to add photo: ${error.message}`);
  return { success: true };
}

// Delete photo from moderation queue
export async function deletePhoto(photoId: string) {
  const { error } = await supabase.from("moderation_photos").delete().eq("id", photoId);

  if (error) throw new Error(`Failed to delete photo: ${error.message}`);
  return { success: true };
}

// Get all photos waiting for moderation for a specific event
export async function getPhotos(eventId: string) {
  const { data, error } = await supabase
    .from("moderation_photos")
    .select("*")
    .eq("event_id", eventId);

  if (error) throw new Error(`Failed to get moderation photos: ${error.message}`);
  return data;
}

// Accept a photo into the official event gallery
export async function acceptPhoto(imageUrl: string, eventId: string) {
  const { error } = await supabase.from("accepted_photos").insert({
    event_id: eventId,
    image_url: imageUrl,
  });

  if (error) throw new Error(`Failed to accept photo: ${error.message}`);
  return { success: true };
}

// Get all accepted photos for an event
export async function getAcceptedPhotos(eventId: string) {
  const { data, error } = await supabase
    .from("accepted_photos")
    .select("*")
    .eq("event_id", eventId);

  if (error) throw new Error(`Failed to get accepted photos: ${error.message}`);
  return data;
}
