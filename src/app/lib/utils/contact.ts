import { supabase } from "@/app/lib/utils/supabaseClient";

// Add photo to moderation queue
export async function addContact(email: string, message: string) {
  const { error } = await supabase.from("contact").insert({
    email: email,
    message: message
  });

  if (error) throw new Error(`Failed to add photo: ${error.message}`);
  return { success: true };
}