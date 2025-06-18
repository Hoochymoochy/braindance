import { supabase } from "@/app/lib/supabaseClient";
import { ParamValue } from "next/dist/server/request/params";

export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  try {
    if (!file) throw new Error("No file provided!");

    const ext = file.name.split(".").pop();
    if (!ext) throw new Error("File extension missing!");

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

    // Correctly get the public URL
    const { data: publicData, error: publicUrlError } = supabase.storage
      .from("event-photos")
      .getPublicUrl(path);

    if (publicUrlError || !publicData?.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    return publicData.publicUrl;

  } catch (err: any) {
    console.error("🔥 Full Upload Failure:", err.message);
    throw err;
  }
}


export async function uploadPartyImage(file: File, eventId: ParamValue): Promise<string> {
  try {
    if (!file) throw new Error("No file provided!");

    const ext = file.name.split(".").pop();
    if (!ext) throw new Error("File extension missing!");

    if (!["jpg", "jpeg", "png", "webp"].includes(ext.toLowerCase())) {
      throw new Error("Unsupported file type.");
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("User not authenticated!");

    const userId = session.user.id;
    const path = `${userId}/events/${eventId}/${Date.now()}.${ext}`; // 👈 make it unique

    // ✅ UPLOAD FIRST
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("moderation-photos")
      .upload(path, file, {
        cacheControl: "3600",
        metadata: { owner: userId },
      });

    if (uploadError) throw new Error("Upload failed: " + uploadError.message);

    // ✅ THEN GET THE PUBLIC URL
    const { data: publicData, error: publicError } = supabase.storage
      .from("moderation-photos")
      .getPublicUrl(path);

    if (publicError) throw new Error("Could not get public URL: " + publicError.message);
    return publicData.publicUrl;

  } catch (err: any) {
    console.error("🔥 Full Upload Failure:", err.message);
    throw err;
  }
}

