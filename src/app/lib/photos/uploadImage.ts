import { supabase } from "@/app/lib/utils/supabaseClient";

const VALID_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function validateFile(file: File) {
  if (!file) throw new Error("No file provided!");
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) throw new Error("File extension missing!");
  if (!VALID_EXTENSIONS.includes(ext)) throw new Error("Unsupported file type.");
  return ext;
}

async function getUserId() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error("User not authenticated!");
  return session.user.id;
}

export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  const ext = validateFile(file);
  const userId = await getUserId();
  const path = `${userId}/events/${eventId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("event-photos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      metadata: { owner: userId },
    });
  if (uploadError) throw new Error("Upload failed: " + uploadError.message);

  const { data: publicData, error: publicUrlError } = supabase.storage
    .from("event-photos")
    .getPublicUrl(path);
  if (publicUrlError || !publicData?.publicUrl) throw new Error("Failed to get public URL");

  return publicData.publicUrl;
}

export async function uploadPartyImage(file: File, eventId: string): Promise<string> {
  const ext = validateFile(file);
  const userId = await getUserId();
  const path = `${userId}/events/${eventId}/${Date.now()}.${ext}`; // Unique per upload

  const { error: uploadError } = await supabase.storage
    .from("moderation-photos")
    .upload(path, file, {
      cacheControl: "3600",
      metadata: { owner: userId },
    });
  if (uploadError) throw new Error("Upload failed: " + uploadError.message);

  const { data: publicData, error: publicError } = supabase.storage
    .from("moderation-photos")
    .getPublicUrl(path);
  if (publicError || !publicData?.publicUrl) throw new Error("Could not get public URL");

  return publicData.publicUrl;
}
