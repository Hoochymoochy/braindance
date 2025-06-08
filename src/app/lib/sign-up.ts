import { supabase } from "@/app/lib/supabaseClient";

export async function signUpHost(email: string, password: string) {
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  console.log("signUpHost", email, password);

  // Step 1: Sign up with Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !user) {
    return { error: authError?.message || "Failed to create user" };
  }

  // Step 2: Create a host record tied to the Supabase user ID
  const { error: hostError } = await supabase
    .from("hosts")
    .insert([{ id: user.id, username: email, password: password }]); // id matches auth.users.id

  if (hostError) {
    return { error: hostError.message };
  }

  return { success: true, id: user.id };
}
