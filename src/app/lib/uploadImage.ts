import { supabase } from "@/app/lib/supabaseClient";

export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  try {
    if (!file) throw new Error("No file provided!");

    const ext = file.name.split(".").pop();
    if (!ext) throw new Error("File extension missing!");

    const path = `events/${eventId}.${ext}`;

    console.log("🔍 Uploading File:", file);
    console.log("File Name:", file.name);
    console.log("Event ID:", eventId);
    console.log("Upload Path:", path);

    // Session check (just for debugging, can remove later)
    const { data: userSession, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) console.warn("⚠️ Session Error:", sessionError);
    else console.log("👤 User Session Active");

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("event-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Upload Error:", uploadError);
      throw new Error("Upload failed: " + uploadError.message);
    }
    console.log("📤 Upload Success:", uploadData);

    // Supabase's getPublicUrl does NOT return an error obj, just returns the URL
    const { publicUrl } = supabase.storage.from("event-photos").getPublicUrl(path);
    console.log("🌐 Public URL:", publicUrl);

    return publicUrl;
  } catch (err: any) {
    console.error("🔥 Full Upload Failure:", err.message);
    throw err;
  }
}
