import { supabase } from "@/app/lib/utils/supabaseClient";

// Add photo to moderation queue
export async function addEmail(email: string) {
  const { error } = await supabase.from("emails").insert({
    email: email,
  });

  if (error) throw new Error(`Failed to add photo: ${error.message}`);
  return { success: true };
}