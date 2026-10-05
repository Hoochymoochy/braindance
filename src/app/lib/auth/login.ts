// lib/auth/login.ts
import { supabase } from "@/app/lib/utils/supabaseClient";
import type { User } from "@supabase/supabase-js";

export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  return data.user!;
}

/** @deprecated Use loginUser */
export const loginHost = loginUser;
