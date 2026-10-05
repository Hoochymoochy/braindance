import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "auth_token";

export type AuthTokenPayload = {
  userId: string;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid auth token payload");
  }

  const record = decoded as Record<string, unknown>;
  // Prefer userId; accept legacy hostId cookies until they expire.
  const userId =
    typeof record.userId === "string"
      ? record.userId
      : typeof record.hostId === "string"
        ? record.hostId
        : null;

  if (!userId) {
    throw new Error("Invalid auth token payload");
  }

  return { userId };
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
};
