import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Generates a new opaque, high-entropy refresh token. The raw value is only
 * ever sent to the client as a cookie — the database stores its hash (see
 * `hashRefreshToken`), never the token itself.
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Hashes a refresh token for storage/lookup. Plain SHA-256 is sufficient
 * here: the token itself is a high-entropy random value, so a keyed hash
 * (HMAC) would only matter if the token had low entropy, which it doesn't.
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Compares a candidate refresh token (as presented by a client) against the
 * hash stored for it in the database. Uses a timing-safe comparison so the
 * check doesn't leak how many leading bytes of a guessed hash matched.
 */
export function verifyRefreshToken(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashRefreshToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');

  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}
