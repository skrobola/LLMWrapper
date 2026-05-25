/** When set, only this Google account may use cloud sync (case-insensitive). */
export function getAllowedCloudEmail(): string | null {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_ALLOWED_EMAIL?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function isEmailAllowedForCloudSync(
  email: string | null | undefined,
): boolean {
  const allowed = getAllowedCloudEmail();
  if (!allowed) return true;
  if (!email) return false;
  return email.trim().toLowerCase() === allowed.toLowerCase();
}
