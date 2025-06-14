import { supabase } from "@/app/lib/supabaseClient";

export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  try {
    if (!file) throw new Error("No file provided!");

    const ext = file.name.split(".").pop();
    if (!ext) throw new Error("File extension missing!");

    // Validate extension
    if (!["jpg", "jpeg", "png", "webp"].includes(ext.toLowerCase())) {
      throw new Error("Unsupported file type.");
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("User not authenticated!");

    const userId = session.user.id;
    const path = `${userId}/events/${eventId}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("event-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        metadata: {
          owner: userId,
        },
      });

    if (uploadError) throw new Error("Upload failed: " + uploadError.message);

    // If bucket is public
    const { publicUrl } = supabase.storage.from("event-photos").getPublicUrl(path);
    return publicUrl;

    // 🔐 If bucket is private:
    // const { data: signed } = await supabase.storage.from("event-photos").createSignedUrl(path, 3600);
    // return signed?.signedUrl ?? "";

  } catch (err: any) {
    console.error("🔥 Full Upload Failure:", err.message);
    throw err;
  }
}

export async function uploadPartyImage(file: File, eventId: string): Promise<string> {
  try {
    if (!file) throw new Error("No file provided!");

    const ext = file.name.split(".").pop();
    if (!ext) throw new Error("File extension missing!");

    // Validate extension
    if (!["jpg", "jpeg", "png", "webp"].includes(ext.toLowerCase())) {
      throw new Error("Unsupported file type.");
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("User not authenticated!");

    const userId = session.user.id;
    const path = `${userId}/events/${eventId}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("moderation-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        metadata: {
          owner: userId,
        },
      });

    if (uploadError) throw new Error("Upload failed: " + uploadError.message);

    // If bucket is public
    const { publicUrl } = supabase.storage.from("event-photos").getPublicUrl(path);
    return publicUrl;

    // 🔐 If bucket is private:
    // const { data: signed } = await supabase.storage.from("event-photos").createSignedUrl(path, 3600);
    // return signed?.signedUrl ?? "";

  } catch (err: any) {
    console.error("🔥 Full Upload Failure:", err.message);
    throw err;
  }
}
