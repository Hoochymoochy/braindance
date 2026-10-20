import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "./config";

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase env is not configured");
  }
  return createClient(url, anonKey);
}

/**
 * Verifies the request carries a Supabase access token for an allowlisted admin email.
 * Client should send `Authorization: Bearer <access_token>`.
 */
export async function requireAdminFromRequest(
  request: NextRequest
): Promise<{ email: string; userId: string }> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    throw new AdminAuthError("Missing Authorization bearer token", 401);
  }

  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) {
    throw new AdminAuthError("Invalid session", 401);
  }

  if (!isAdminEmail(data.user.email)) {
    throw new AdminAuthError("Not an admin", 403);
  }

  return { email: data.user.email, userId: data.user.id };
}

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
