import { supabase } from "@/app/lib/supabaseClient";

export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `events/${eventId}.${ext}`;

  const { error } = await supabase.storage
    .from("event-photos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw new Error("Upload failed: " + error.message);

  const { data } = supabase.storage.from("event-posters").getPublicUrl(path);
  return data.publicUrl;
}
