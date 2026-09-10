import crypto from "crypto";

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "copan2026";
const SECRET_KEY = process.env.SESSION_SECRET || "bnbmanager-admin-secret-key-salt";

export function checkPassword(password: string): boolean {
  const expectedPassword = DEFAULT_ADMIN_PASSWORD;
  const bufA = Buffer.from(password.padEnd(64, " "));
  const bufB = Buffer.from(expectedPassword.padEnd(64, " "));
  return crypto.timingSafeEqual(bufA, bufB) && password === expectedPassword;
}

export function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac("sha256", SECRET_KEY).update(timestamp).digest("hex");
  return `${timestamp}.${hmac}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, hash] = parts;
  const expectedHash = crypto.createHmac("sha256", SECRET_KEY).update(timestamp).digest("hex");

  try {
    const isMatch = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
    const tokenTime = parseInt(timestamp, 10);
    // Session valid for 7 days
    const isExpired = Date.now() - tokenTime > 7 * 24 * 60 * 60 * 1000;
    return isMatch && !isExpired;
  } catch {
    return false;
  }
}
