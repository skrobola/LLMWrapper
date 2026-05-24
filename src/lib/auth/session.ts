import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "llm-wrapper-session";

function getAuthSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.SITE_PASSWORD && getAuthSecret());
}

export async function createSessionToken(): Promise<string | null> {
  const secret = getAuthSecret();
  if (!secret) return null;

  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = getAuthSecret();
  if (!secret) return false;

  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function verifySitePassword(password: string): boolean {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return false;

  if (password.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
