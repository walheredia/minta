import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateRefreshToken, hashRefreshToken, verifyRefreshToken } from './refresh-token.util.js';

describe('hashRefreshToken', () => {
  it('hashes a token deterministically, matching an independently computed SHA-256 digest', () => {
    const token = 'some-opaque-refresh-token-value';

    expect(hashRefreshToken(token)).toBe(createHash('sha256').update(token).digest('hex'));
  });

  it('never returns the raw token as its own hash', () => {
    const token = 'raw-token-value';

    expect(hashRefreshToken(token)).not.toBe(token);
  });

  it('produces different hashes for different tokens', () => {
    expect(hashRefreshToken('token-a')).not.toBe(hashRefreshToken('token-b'));
  });
});

describe('verifyRefreshToken', () => {
  it('accepts a token against its own stored hash', () => {
    const token = 'correct-token';
    const storedHash = hashRefreshToken(token);

    expect(verifyRefreshToken(token, storedHash)).toBe(true);
  });

  it('rejects a token that does not match the stored hash', () => {
    const storedHash = hashRefreshToken('correct-token');

    expect(verifyRefreshToken('wrong-token', storedHash)).toBe(false);
  });
});

describe('generateRefreshToken', () => {
  it('generates unique, URL-safe, high-entropy tokens', () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(32);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
