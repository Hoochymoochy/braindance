import { supabase } from "@/app/lib/utils/supabaseClient";

// Add photo to moderation queue
export async function addFeedback(message: string) {
  const { error } = await supabase.from("feedback").insert({
    message: message  
  });
  if (error) throw new Error(`Failed to add photo: ${error.message}`);
  return { success: true };
}