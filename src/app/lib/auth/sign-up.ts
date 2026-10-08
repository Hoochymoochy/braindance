import { supabase } from "@/app/lib/utils/supabaseClient";
import { ensureProfileForCurrentUser } from "@/app/lib/profile/profile";

type SignUpResult = { success: true; id: string } | { error: string };

export async function signUpUser(
  email: string,
  password: string
): Promise<SignUpResult> {
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.signUp({ email, password });

  if (authError || !user) {
    return { error: authError?.message || "Failed to create user" };
  }

  try {
    // Profile must exist before crates/moments (FK → profiles.id).
    await ensureProfileForCurrentUser();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create profile",
    };
  }

  return { success: true, id: user.id };
}

/** @deprecated Use signUpUser */
export const signUpHost = signUpUser;
