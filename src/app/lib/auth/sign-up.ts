import { supabase } from "@/app/lib/utils/supabaseClient";

type SignUpResult = 
  | { success: true; id: string }
  | { error: string };

export async function signUpHost(email: string, password: string): Promise<SignUpResult> {
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Step 1: Sign up via Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.signUp({ email, password });

  if (authError || !user) {
    return { error: authError?.message || "Failed to create user" };
  }

  // Step 2: Create the host profile (username = email, no raw password stored)
  const { error: hostError } = await supabase
    .from("hosts")
    .insert([{ id: user.id, username: email }]);

  if (hostError) {
    return { error: hostError.message };
  }

  return { success: true, id: user.id };
}
