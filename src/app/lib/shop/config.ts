/** Emails allowed into /admin. Case-insensitive. */
export const ADMIN_EMAILS = ["khaydenroberts22@gmail.com"] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((allowed) => allowed === normalized);
}

export const SHOP_STORAGE_KEY = "braindance-shop-design-v1";
